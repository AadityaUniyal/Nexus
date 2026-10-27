@description('Azure region for all resources (defaults to resource group location). Recommended: eastus or centralus for Azure for Students.')
param location string = resourceGroup().location

@description('Unique application prefix for all resource names.')
@minLength(3)
@maxLength(12)
param appPrefix string = 'nexus'

@description('Deployment environment tier.')
@allowed([
  'student-dev'
  'production'
])
param environmentType string = 'student-dev'

@description('Administrator login username for PostgreSQL Flexible Server.')
param dbAdminUsername string = 'nexus_admin'

@description('Administrator password for PostgreSQL Flexible Server.')
@secure()
param dbAdminPassword string

@description('Clerk JWT Issuer URL for user authentication.')
param clerkIssuer string = ''

@description('Clerk JWKS URL for cryptographic token verification.')
param clerkJwksUrl string = ''

@description('Container Image for Nexus FastAPI Backend.')
param backendImage string = 'ghcr.io/aadityauniyal/nexus-backend:latest'

@description('Container Image for Nexus Next.js 15 Frontend.')
param frontendImage string = 'ghcr.io/aadityauniyal/nexus-frontend:latest'

// Deterministic unique suffix based on resource group ID
var uniqueSuffix = uniqueString(resourceGroup().id)
var sanitizedPrefix = toLower(appPrefix)

// Resource Names
var managedIdentityName = 'id-${sanitizedPrefix}-${uniqueSuffix}'
var logAnalyticsName = 'log-${sanitizedPrefix}-${uniqueSuffix}'
var appInsightsName = 'appi-${sanitizedPrefix}-${uniqueSuffix}'
var storageAccountName = 'st${take(sanitizedPrefix, 6)}${take(uniqueSuffix, 14)}'
var keyVaultName = 'kv-${take(sanitizedPrefix, 8)}-${take(uniqueSuffix, 8)}'
var postgresServerName = 'psql-${sanitizedPrefix}-${uniqueSuffix}'
var containerAppEnvName = 'cae-${sanitizedPrefix}-${uniqueSuffix}'
var backendAppName = 'ca-${sanitizedPrefix}-backend'
var frontendAppName = 'ca-${sanitizedPrefix}-frontend'
var iotHubName = 'iot-${sanitizedPrefix}-${uniqueSuffix}'

// Common Resource Tags
var defaultTags = {
  application: 'Nexus-Freight-OS'
  environment: environmentType
  managedBy: 'AzureBicep'
  tier: 'AzureForStudents'
}

// 1. User-Assigned Managed Identity (Enables passwordless Azure service interconnects)
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: managedIdentityName
  location: location
  tags: defaultTags
}

// 2. Log Analytics Workspace (Free 5GB/month data ingestion)
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  tags: defaultTags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// 3. Azure Application Insights (Distributed tracing, APM, and exception monitoring)
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: defaultTags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// 4. Azure Storage Account (Standard LRS, 5GB free tier, hot blob tier for PoD & documents)
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: defaultTags
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
  }
}

resource blobServices 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource podContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: 'documents-pod'
  properties: {
    publicAccess: 'None'
  }
}

resource telemetryBronzeContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: 'telemetry-bronze'
  properties: {
    publicAccess: 'None'
  }
}

resource disputeContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobServices
  name: 'dispute-evidence'
  properties: {
    publicAccess: 'None'
  }
}

// 5. Azure Key Vault (Hardware-grade secrets storage for DB strings & API keys)
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
  }
}

// 6. Azure Database for PostgreSQL Flexible Server (Burstable B1ms tier for Student Accounts)
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: postgresServerName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: dbAdminUsername
    administratorLoginPassword: dbAdminPassword
    storage: {
      storageSizeGB: 32
      autoGrow: 'Disabled'
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-03-01-preview' = {
  parent: postgresServer
  name: 'nexus_db'
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Allow Azure services firewall rule (0.0.0.0 to 0.0.0.0 allows internal Azure Container Apps)
resource postgresFirewallAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-03-01-preview' = {
  parent: postgresServer
  name: 'AllowAllAzureInternalIPs'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// 7. Azure IoT Hub (F1 Free Tier - 8,000 telemetry messages/day free)
resource iotHub 'Microsoft.Devices/IotHubs@2023-06-30' = {
  name: iotHubName
  location: location
  sku: {
    name: 'F1'
    capacity: 1
  }
  properties: {
    minTlsVersion: '1.2'
  }
}

// 8. Azure Container Apps Managed Environment (Consumption Tier - Free 180,000 vCPU-s/month)
resource containerAppEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerAppEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// 9. Nexus Backend API Container App
resource backendApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: backendAppName
  location: location
  identity: {
    type: 'UserAssigned'
    userAssignedIdentities: {
      '${managedIdentity.id}': {}
    }
  }
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 8000
        transport: 'auto'
        allowInsecure: false
      }
    }
    template: {
      containers: [
        {
          name: 'backend'
          image: backendImage
          resources: {
            cpu: json('0.5')
            memory: '1.0Gi'
          }
          env: [
            {
              name: 'APP_ENV'
              value: 'production'
            }
            {
              name: 'DATABASE_URL'
              value: 'postgresql+asyncpg://${dbAdminUsername}:${dbAdminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/nexus_db?ssl=require'
            }
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
              value: appInsights.properties.ConnectionString
            }
            {
              name: 'AZURE_STORAGE_ACCOUNT_NAME'
              value: storageAccount.name
            }
            {
              name: 'AZURE_IOT_HUB_HOSTNAME'
              value: '${iotHub.name}.azure-devices.net'
            }
            {
              name: 'CLERK_ISSUER'
              value: clerkIssuer
            }
            {
              name: 'CLERK_JWKS_URL'
              value: clerkJwksUrl
            }
            {
              name: 'REDIS_ENABLED'
              value: 'false'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0 // Scale-to-zero when idle to save 100% of student compute credits
        maxReplicas: 2
      }
    }
  }
}

// 10. Nexus Frontend Next.js 15 Container App
resource frontendApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: frontendAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'auto'
        allowInsecure: false
      }
    }
    template: {
      containers: [
        {
          name: 'frontend'
          image: frontendImage
          resources: {
            cpu: json('0.5')
            memory: '1.0Gi'
          }
          env: [
            {
              name: 'NEXT_PUBLIC_API_URL'
              value: 'https://${backendApp.properties.configuration.ingress.fqdn}'
            }
            {
              name: 'NODE_ENV'
              value: 'production'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0 // Scale-to-zero when idle
        maxReplicas: 2
      }
    }
  }
}

// Outputs
output subscriptionId string = subscription().subscriptionId
output resourceGroupName string = resourceGroup().name
output backendFqdn string = backendApp.properties.configuration.ingress.fqdn
output frontendFqdn string = frontendApp.properties.configuration.ingress.fqdn
output postgresFqdn string = postgresServer.properties.fullyQualifiedDomainName
output storageAccountName string = storageAccount.name
output keyVaultName string = keyVault.name
output iotHubHostName string = '${iotHub.name}.azure-devices.net'
output appInsightsConnectionString string = appInsights.properties.ConnectionString
