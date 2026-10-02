// =============================================================================
// NEXUS Enterprise Logistics Infrastructure — Azure & Microsoft Fabric Bicep Template
// =============================================================================

@description('Location for all resources.')
param location string = resourceGroup().location

@description('Deployment environment (dev, staging, prod).')
@allowed([
  'dev'
  'staging'
  'prod'
])
param environment string = 'prod'

@description('Name prefix for all NEXUS Azure resources.')
param namePrefix string = 'nexus-logistics'

@description('Administrator username for PostgreSQL Flexible Server.')
param dbAdminUser string = 'nexusadmin'

@description('Administrator password for PostgreSQL Flexible Server.')
@secure()
param dbAdminPassword string

@description('Docker image for Nexus Backend API.')
param backendImage string = 'ghcr.io/aadityauniyal/nexus-backend:latest'

var uniqueSuffix = uniqueString(resourceGroup().id)
var logAnalyticsName = '${namePrefix}-logs-${environment}'
var appInsightsName = '${namePrefix}-ai-${environment}'
var storageAccountName = take('${replace(namePrefix, '-', '')}sa${environment}${uniqueSuffix}', 24)
var keyVaultName = take('${namePrefix}-kv-${environment}-${uniqueSuffix}', 24)
var postgresName = '${namePrefix}-pg-${environment}-${uniqueSuffix}'
var redisName = '${namePrefix}-redis-${environment}'
var iotHubName = '${namePrefix}-iothub-${environment}'
var appServicePlanName = '${namePrefix}-plan-${environment}'
var appServiceName = '${namePrefix}-app-${environment}'

// -----------------------------------------------------------------------------
// 1. Azure Log Analytics Workspace
// -----------------------------------------------------------------------------
resource logAnalyticsWorkspace 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// -----------------------------------------------------------------------------
// 2. Azure Application Insights
// -----------------------------------------------------------------------------
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalyticsWorkspace.id
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// -----------------------------------------------------------------------------
// 3. Azure Storage Account (CSV Imports, Telemetry Archive, Blob Attachments)
// -----------------------------------------------------------------------------
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
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

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource csvImportsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'csv-imports'
  properties: {
    publicAccess: 'None'
  }
}

resource telemetryRawContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'telemetry-raw'
  properties: {
    publicAccess: 'None'
  }
}

// Medallion Architecture Containers (Bronze / Silver / Gold)
resource telemetryBronzeContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'telemetry-bronze'
  properties: {
    publicAccess: 'None'
  }
}

resource telemetrySilverContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'telemetry-silver'
  properties: {
    publicAccess: 'None'
  }
}

resource analyticsGoldContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'analytics-gold'
  properties: {
    publicAccess: 'None'
  }
}

// -----------------------------------------------------------------------------
// 4. Azure Key Vault (Secrets Management)
// -----------------------------------------------------------------------------
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  properties: {
    enabledForDeployment: false
    enabledForTemplateDeployment: true
    enabledForDiskEncryption: false
    enableRbacAuthorization: true
    tenantId: subscription().tenantId
    sku: {
      name: 'standard'
      family: 'A'
    }
    networkAcls: {
      defaultAction: 'Allow'
      bypass: 'AzureServices'
    }
  }
}

// -----------------------------------------------------------------------------
// 5. Azure Database for PostgreSQL Flexible Server
// -----------------------------------------------------------------------------
resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: postgresName
  location: location
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    administratorLogin: dbAdminUser
    administratorLoginPassword: dbAdminPassword
    storage: {
      storageSizeGB: 32
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
  name: 'nexus'
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Allow Azure Services access to PostgreSQL
resource postgresFirewallRule 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-03-01-preview' = {
  parent: postgresServer
  name: 'AllowAllAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// -----------------------------------------------------------------------------
// 6. Azure Cache for Redis
// -----------------------------------------------------------------------------
resource redisCache 'Microsoft.Cache/redis@2023-08-01' = {
  name: redisName
  location: location
  properties: {
    sku: {
      name: 'Basic'
      family: 'C'
      capacity: 1
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
  }
}

// -----------------------------------------------------------------------------
// 7. Azure IoT Hub Gateway (High-throughput Vehicle Telemetry Ingestion)
// -----------------------------------------------------------------------------
// FREE TIER LIMIT: Max 8,000 messages/day. 1 free IoT Hub per subscription.
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

// -----------------------------------------------------------------------------
// 8. Azure App Service Plan & Web App (Backend API)
// -----------------------------------------------------------------------------
// FREE TIER LIMIT: 60 minutes/day compute. No custom domains/SSL.
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: {
    name: 'F1'
    tier: 'Free'
  }
  properties: {
    reserved: true
  }
}

resource appService 'Microsoft.Web/sites@2022-09-01' = {
  name: appServiceName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|${backendImage}'
      alwaysOn: false
      http20Enabled: true
      minTlsVersion: '1.2'
      appSettings: [
        {
          name: 'APP_ENV'
          value: environment
        }
        {
          name: 'SECRET_KEY'
          value: uniqueString(resourceGroup().id, deployment().name)
        }
        {
          name: 'AZURE_IOT_HUB_ENABLED'
          value: 'true'
        }
        {
          name: 'AZURE_IOT_HUB_HOSTNAME'
          value: iotHub.properties.hostName
        }
        {
          name: 'FABRIC_ONELAKE_ENABLED'
          value: 'true'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
        {
          name: 'REDIS_URL'
          value: 'rediss://:${redisCache.listKeys().primaryKey}@${redisCache.properties.hostName}:${redisCache.properties.sslPort}/0'
        }
        {
          name: 'STORAGE_ACCOUNT_NAME'
          value: storageAccount.name
        }
        {
          name: 'DATABASE_URL'
          value: 'postgresql+asyncpg://${dbAdminUser}:${dbAdminPassword}@${postgresServer.properties.fullyQualifiedDomainName}:5432/nexus?ssl=require'
        }
        {
          name: 'CORS_ORIGINS'
          value: 'https://${appServiceName}.azurewebsites.net,http://localhost:3000'
        }
      ]
    }
  }
}

// -----------------------------------------------------------------------------
// 9. Azure SQL Database (Free Tier alternative)
// -----------------------------------------------------------------------------
// FREE TIER LIMIT: 100,000 vCore seconds/month, 32GB storage. 1 free SQL DB per subscription.
resource sqlServer 'Microsoft.Sql/servers@2023-05-01-preview' = {
  name: '${namePrefix}-sql-${environment}-${uniqueSuffix}'
  location: location
  properties: {
    administratorLogin: dbAdminUser
    administratorLoginPassword: dbAdminPassword
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2023-05-01-preview' = {
  parent: sqlServer
  name: 'nexus-sql'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    isLedgerOn: false
  }
}

// -----------------------------------------------------------------------------
// 10. Azure Functions (Consumption Plan)
// -----------------------------------------------------------------------------
// FREE TIER LIMIT: 1 million executions/month, 400,000 GB-s compute.
resource functionAppPlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${namePrefix}-funcplan-${environment}'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {
    reserved: true
  }
}

resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: '${namePrefix}-func-${environment}-${uniqueSuffix}'
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: functionAppPlan.id
    siteConfig: {
      linuxFxVersion: 'PYTHON|3.11'
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${environment().suffixes.storage};AccountKey=${listKeys(storageAccount.id, '2023-01-01').keys[0].value}'
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'python'
        }
      ]
    }
  }
}

// -----------------------------------------------------------------------------
// Outputs
// -----------------------------------------------------------------------------
output appServiceEndpoint string = 'https://${appService.properties.defaultHostName}'
output postgresHost string = postgresServer.properties.fullyQualifiedDomainName
output iotHubHostName string = iotHub.properties.hostName
output redisHostName string = redisCache.properties.hostName
output storageAccountName string = storageAccount.name
output keyVaultUri string = keyVault.properties.vaultUri
