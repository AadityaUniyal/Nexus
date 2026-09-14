// =============================================================================
// NEXUS Enterprise Logistics Infrastructure — Azure & Microsoft Fabric Bicep Template
// =============================================================================

@description('Location for all resources.')
param location string = resourceGroup().location

@description('Deployment environment (dev, staging, prod).')
param environment string = 'prod'

@description('Name prefix for all NEXUS Azure resources.')
param namePrefix string = 'nexus-logistics'

var appServiceName = '${namePrefix}-app-${environment}'
var postgresName = '${namePrefix}-db-${environment}'
var redisName = '${namePrefix}-redis-${environment}'
var iotHubName = '${namePrefix}-iothub-${environment}'
var appInsightsName = '${namePrefix}-ai-${environment}'

// 1. Azure Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

// 2. Azure Cache for Redis
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

// 3. Azure IoT Hub Gateway
resource iotHub 'Microsoft.Devices/IotHubs@2023-06-30' = {
  name: iotHubName
  location: location
  sku: {
    name: 'S1'
    capacity: 1
  }
  properties: {
    minTlsVersion: '1.2'
  }
}

// 4. Azure App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2022-09-01' = {
  name: '${namePrefix}-plan-${environment}'
  location: location
  kind: 'linux'
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  properties: {
    reserved: true
  }
}

// 5. Azure App Service (Backend Container)
resource appService 'Microsoft.Web/sites@2022-09-01' = {
  name: appServiceName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|ghcr.io/aadityauniyal/nexus-backend:latest'
      appSettings: [
        {
          name: 'APP_ENV'
          value: environment
        }
        {
          name: 'AZURE_IOT_HUB_ENABLED'
          value: 'true'
        }
        {
          name: 'FABRIC_ONELAKE_ENABLED'
          value: 'true'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
      ]
    }
  }
}

output appServiceEndpoint string = 'https://${appService.properties.defaultHostName}'
output iotHubHostName string = iotHub.properties.hostName
output redisHostName string = redisCache.properties.hostName
