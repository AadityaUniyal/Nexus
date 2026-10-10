targetScope = 'subscription'

@description('Name of the resource group')
param resourceGroupName string = 'rg-nexus-real'

@description('Azure region for regional resources (must be an allowed student region)')
@allowed([
  'austriaeast'
  'southeastasia'
  'eastasia'
  'koreacentral'
  'malaysiawest'
])
param location string = 'austriaeast'

@description('Location for Azure Maps account')
param mapsLocation string = 'global'

@description('Base name prefix for resources')
@minLength(3)
@maxLength(10)
param baseName string = 'nexus'

@description('Notification email for cost budget alerts')
param notificationEmail string = '240211539@geu.ac.in'

@description('Total subscription budget amount for alert baseline ($100 student credit)')
param budgetAmount int = 100

@description('Start date for budget tracking (YYYY-MM-01 format)')
param budgetStartDate string = '2026-10-01T00:00:00Z'

// Resource Group definition
resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: resourceGroupName
  location: location
  tags: {
    Project: 'NEXUS'
    Environment: 'Development'
    ManagedBy: 'Bicep'
  }
}

// Deploy resource stack inside the Resource Group
module resources 'modules/resources.bicep' = {
  name: 'nexus-resources-deployment'
  scope: rg
  params: {
    baseName: baseName
    location: location
    mapsLocation: mapsLocation
  }
}

// Cost Management Budget at Subscription scope
// Threshold 1: 50% ($50)
// Threshold 2: 80% ($80)
resource budget 'Microsoft.Consumption/budgets@2021-10-01' = if (!empty(notificationEmail)) {
  name: 'nexus-student-budget'
  properties: {
    timeGrain: 'Monthly'
    amount: budgetAmount
    category: 'Cost'
    timePeriod: {
      startDate: budgetStartDate
    }
    notifications: {
      Threshold_50_Percent: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 50
        contactEmails: [
          notificationEmail
        ]
      }
      Threshold_80_Percent: {
        enabled: true
        operator: 'GreaterThan'
        threshold: 80
        contactEmails: [
          notificationEmail
        ]
      }
    }
  }
}

output resourceGroupName string = rg.name
output managedIdentityClientId string = resources.outputs.managedIdentityClientId
output mapsAccountName string = resources.outputs.mapsAccountName
output keyVaultUri string = resources.outputs.keyVaultUri
output storageAccountName string = resources.outputs.storageAccountName
output appInsightsConnectionString string = resources.outputs.appInsightsConnectionString
