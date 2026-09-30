# BBQ Cook Logbook infrastructure

This resource-group-scoped composition creates only the resources needed for
the application and its durable store: an Azure Storage account and
`CookLogs` table, a Linux App Service plan, and a Linux web app. Storage and
compute are isolated to the team's assigned resource group; names include a
resource-group-specific suffix.

The web app uses a system-assigned managed identity. It receives **Storage
Table Data Contributor** only on the `CookLogs` table. Shared-key authorization
is disabled; the application uses Microsoft Entra ID through the App Service
managed identity. The app accepts HTTPS only, requires TLS 1.2, uses Node.js
22 LTS, and disables FTP/SCM basic publishing credentials. Public web access
is enabled for the capstone's reachable application; storage access remains
Entra-authorized.

## Pinned Azure Verified Modules

| Resource | Module | Version |
|---|---|---:|
| Storage account and table | `avm/res/storage/storage-account` | `0.33.1` |
| Linux App Service plan | `avm/res/web/serverfarm` | `0.7.0` |
| Linux web app | `avm/res/web/site` | `0.24.0` |

The table-scoped native role assignment is composed directly because it
depends on the web app's system-assigned identity and the table created by the
storage module.

## Parameters and scope

Obtain the assigned resource group, team identifier, and any required region
from the workshop environment. Do not substitute a personal subscription or
invent team values. `teamIdentifier` is required; `location` defaults to the
assigned resource group's region, and `appServicePlanSku` defaults to `B1`.
The application table defaults to `CookLogs`.

Use the team's approved parameter file (not committed here) for environment
values. It must reference this entry point and supply the assigned team
identifier; set `location` only when the team has an approved region:

```bicep
using './main.bicep'

param teamIdentifier = '<assigned-team-identifier>'
```

## Validate

Run from the repository root in Windows PowerShell:

```powershell
$resourceGroup = '<assigned-team-resource-group>'
$parameters = '.\capstone\bbq-logbook\infra\team.bicepparam'

az bicep build --file .\capstone\bbq-logbook\infra\main.bicep
az deployment group validate `
  --resource-group $resourceGroup `
  --parameters $parameters
az deployment group what-if `
  --name bbq-cook-logbook-preview `
  --resource-group $resourceGroup `
  --parameters $parameters
```

Azure validation and `what-if` require an authenticated Azure CLI session
with access to the assigned resource group and its approved parameter file.
Do not report either check as passed unless the command ran against that exact
scope and its output was reviewed.

## Outputs

The deployment exposes the application name and HTTPS URL, web app resource
ID, deployment identifier, and storage account, table, endpoint, and table
resource ID. It emits no storage keys or credentials.
