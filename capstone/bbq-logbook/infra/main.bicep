targetScope = 'resourceGroup'

@description('Assigned team identifier used to isolate and name the capstone resources.')
@minLength(2)
@maxLength(32)
param teamIdentifier string

@description('Azure region for all resources. Defaults to the assigned resource group region.')
param location string = resourceGroup().location

@description('App Service plan SKU.')
param appServicePlanSku string = 'B1'

@description('Azure Table Storage table used by the BBQ Cook Logbook.')
param cookLogTableName string = 'CookLogs'

var uniqueSuffix = uniqueString(resourceGroup().id, teamIdentifier)
var storageAccountName = 'stbbq${uniqueSuffix}'
var appServicePlanName = 'plan-bbq-${uniqueSuffix}'
var webAppName = 'bbq-log-${uniqueSuffix}'
var commonTags = {
  workload: 'bbq-cook-logbook'
  team: teamIdentifier
  managedBy: 'bicep'
}

module storage 'br/public:avm/res/storage/storage-account:0.33.1' = {
  name: 'storage'
  params: {
    name: storageAccountName
    location: location
    skuName: 'Standard_LRS'
    kind: 'StorageV2'
    allowBlobPublicAccess: false
    allowCrossTenantReplication: false
    allowSharedKeyAccess: false
    defaultToOAuthAuthentication: true
    minimumTlsVersion: 'TLS1_2'
    publicNetworkAccess: 'Enabled'
    supportsHttpsTrafficOnly: true
    tableServices: {
      tables: [
        {
          name: cookLogTableName
        }
      ]
    }
    tags: commonTags
  }
}

module appServicePlan 'br/public:avm/res/web/serverfarm:0.7.0' = {
  name: 'app-service-plan'
  params: {
    name: appServicePlanName
    location: location
    kind: 'linux'
    reserved: true
    skuName: appServicePlanSku
    skuCapacity: 1
    zoneRedundant: false
    tags: commonTags
  }
}

module webApp 'br/public:avm/res/web/site:0.24.0' = {
  name: 'web-app'
  params: {
    name: webAppName
    location: location
    kind: 'app,linux'
    serverFarmResourceId: appServicePlan.outputs.resourceId
    httpsOnly: true
    clientAffinityEnabled: false
    managedIdentities: {
      systemAssigned: true
    }
    publicNetworkAccess: 'Enabled'
    siteConfig: {
      alwaysOn: true
      ftpsState: 'Disabled'
      http20Enabled: true
      linuxFxVersion: 'NODE|22-lts'
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      use32BitWorkerProcess: false
      webSocketsEnabled: false
    }
    configs: [
      {
        name: 'appsettings'
        retainCurrentAppSettings: false
        properties: {
          NODE_ENV: 'production'
          PORT: '8080'
          WEBSITE_NODE_DEFAULT_VERSION: '~22'
          SCM_DO_BUILD_DURING_DEPLOYMENT: 'true'
          ENABLE_ORYX_BUILD: 'true'
          STORAGE_BACKEND: 'azure'
          BBQ_TABLE_ENDPOINT: 'https://${storage.outputs.name}.table.${environment().suffixes.storage}'
          BBQ_TABLE_NAME: cookLogTableName
        }
      }
    ]
    basicPublishingCredentialsPolicies: [
      {
        name: 'ftp'
        allow: false
      }
      {
        name: 'scm'
        allow: false
      }
    ]
    tags: commonTags
  }
}

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: storageAccountName
}

resource tableService 'Microsoft.Storage/storageAccounts/tableServices@2023-05-01' existing = {
  parent: storageAccount
  name: 'default'
}

resource cookLogTable 'Microsoft.Storage/storageAccounts/tableServices/tables@2023-05-01' existing = {
  parent: tableService
  name: cookLogTableName
}

var storageTableDataContributorRoleDefinitionId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3'
)

resource storageTableDataContributor 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(cookLogTable.id, webAppName, storageTableDataContributorRoleDefinitionId)
  scope: cookLogTable
  properties: {
    roleDefinitionId: storageTableDataContributorRoleDefinitionId
    principalId: webApp.outputs.systemAssignedMIPrincipalId!
    principalType: 'ServicePrincipal'
    description: 'Allows the BBQ Cook Logbook web app to read and write cook logs in its table.'
  }
}

@description('Name of the deployed App Service web app.')
output appName string = webApp.outputs.name

@description('HTTPS URL of the deployed BBQ Cook Logbook.')
output appUrl string = 'https://${webApp.outputs.defaultHostname}'

@description('Resource ID of the deployed web app.')
output appResourceId string = webApp.outputs.resourceId

@description('Deployment identifier used for evidence collection.')
output deploymentIdentifier string = deployment().name

@description('Table Storage details required by the application.')
output storage object = {
  accountName: storage.outputs.name
  tableName: cookLogTableName
  tableEndpoint: 'https://${storage.outputs.name}.table.${environment().suffixes.storage}'
  tableResourceId: cookLogTable.id
}
