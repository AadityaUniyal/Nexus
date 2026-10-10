@description('Base name for resources')
@minLength(3)
@maxLength(10)
param baseName string = 'nexus'

@description('Deployment location for regional resources')
param location string = 'austriaeast'

@description('Location for Azure Maps (supports global or regional)')
param mapsLocation string = 'global'

@description('Unique suffix for globally unique resource names')
param uniqueSuffix string = take(uniqueString(resourceGroup().id), 12)

// User-assigned managed identity for NEXUS backend
resource managedIdentity 'Microsoft.ManagedIdentity/userAssignedIdentities@2023-01-31' = {
  name: '${baseName}-id-${uniqueSuffix}'
  location: location
}

// Azure Maps Gen2 Account
resource mapsAccount 'Microsoft.Maps/accounts@2023-06-01' = {
  name: '${baseName}-maps-${uniqueSuffix}'
  location: mapsLocation
  sku: {
    name: 'G2'
  }
  properties: {
    disableLocalAuth: false
  }
}

// Key Vault with RBAC authorization
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: take('${baseName}-kv-${uniqueSuffix}', 24)
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

// Storage Account for daily telemetry/parquet exports
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: toLower('${baseName}st${uniqueSuffix}')
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
    allowBlobPublicAccess: false
    accessTier: 'Hot'
  }
}

// Blob service and exports container
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource exportsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-01-01' = {
  parent: blobService
  name: 'telemetry-exports'
  properties: {
    publicAccess: 'None'
  }
}

// Log Analytics Workspace (retention 30 days for free tier limits)
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: '${baseName}-logs-${uniqueSuffix}'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// Application Insights component linked to Log Analytics
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${baseName}-ai-${uniqueSuffix}'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// Role Assignment: Azure Maps Data Reader for Managed Identity
// Role Definition ID: 423170ca-a8f6-4b0f-8487-9e4eb8f49bfa
resource mapsDataReaderRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(mapsAccount.id, managedIdentity.id, '423170ca-a8f6-4b0f-8487-9e4eb8f49bfa')
  scope: mapsAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '423170ca-a8f6-4b0f-8487-9e4eb8f49bfa')
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Role Assignment: Key Vault Secrets User for Managed Identity
// Role Definition ID: 4633458b-17de-408a-b874-0445c86b69e6
resource kvSecretsUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, managedIdentity.id, '4633458b-17de-408a-b874-0445c86b69e6')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

// Role Assignment: Storage Blob Data Contributor for Managed Identity
// Role Definition ID: ba92f5b4-2d11-453d-a403-e96b0029c9fe
resource storageBlobContributorRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storageAccount.id, managedIdentity.id, 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
  scope: storageAccount
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
    principalId: managedIdentity.properties.principalId
    principalType: 'ServicePrincipal'
  }
}

output managedIdentityId string = managedIdentity.id
output managedIdentityClientId string = managedIdentity.properties.clientId
output managedIdentityPrincipalId string = managedIdentity.properties.principalId
output mapsAccountId string = mapsAccount.id
output mapsAccountName string = mapsAccount.name
output keyVaultId string = keyVault.id
output keyVaultUri string = keyVault.properties.vaultUri
output storageAccountId string = storageAccount.id
output storageAccountName string = storageAccount.name
output logAnalyticsId string = logAnalytics.id
output appInsightsConnectionString string = appInsights.properties.ConnectionString
