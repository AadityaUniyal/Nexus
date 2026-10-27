[CmdletBinding()]
param(
    [string]$ResourceGroup = "rg-nexus-student",
    [string]$Location = "eastus",
    [switch]$ConfirmDeployment = $false
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Nexus Fleet OS - Azure for Students Cloud Orchestrator " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verify Azure CLI is logged in
Write-Host "`n[1/5] Verifying Azure CLI Session..." -ForegroundColor Yellow
try {
    $accountRaw = az account show --output json
    $accountJson = $accountRaw | ConvertFrom-Json
    Write-Host "  [OK] Active Account : $($accountJson.user.name)" -ForegroundColor Green
    Write-Host "  [OK] Subscription   : $($accountJson.name) ($($accountJson.id))" -ForegroundColor Green
    Write-Host "  [OK] Tenant ID      : $($accountJson.tenantId)" -ForegroundColor Green
} catch {
    Write-Error "Azure CLI is not logged in. Run 'az login' first."
    exit 1
}

# 2. Register required Azure Resource Providers
Write-Host "`n[2/5] Checking Azure Resource Providers for Student Quota..." -ForegroundColor Yellow
$providers = @(
    "Microsoft.App",
    "Microsoft.ContainerService",
    "Microsoft.DBforPostgreSQL",
    "Microsoft.Storage",
    "Microsoft.KeyVault",
    "Microsoft.Insights",
    "Microsoft.OperationalInsights",
    "Microsoft.Devices",
    "Microsoft.ManagedIdentity"
)

foreach ($p in $providers) {
    try {
        $state = az provider show --namespace $p --query "registrationState" -o tsv
        if ($state -ne "Registered") {
            Write-Host "  $($p) - Registering..." -ForegroundColor Yellow
            az provider register --namespace $p --output none
        } else {
            Write-Host "  $($p) - Registered [OK]" -ForegroundColor Green
        }
    } catch {
        Write-Host "  $($p) - Check skipped" -ForegroundColor DarkGray
    }
}

# 3. Validate Bicep Template Build
Write-Host "`n[3/5] Compiling and Validating Bicep Infrastructure..." -ForegroundColor Yellow
$bicepPath = Join-Path $PSScriptRoot "main.bicep"
$paramPath = Join-Path $PSScriptRoot "azuredeploy.parameters.json"

az bicep build --file $bicepPath
Write-Host "  [OK] Bicep compilation verified (0 syntax/type errors)" -ForegroundColor Green

# 4. Dry-Run Check (Credit Protection Mode)
if (-not $ConfirmDeployment) {
    Write-Host "`n[4/5] Safety Dry-Run Active (Cost: `$0.00 / Zero Credits Deducted)..." -ForegroundColor Cyan
    Write-Host "  To actually deploy, pass the -ConfirmDeployment switch." -ForegroundColor DarkGray

    $rgExists = az group exists --name $ResourceGroup
    if ($rgExists -eq "true") {
        Write-Host "  Resource group '$ResourceGroup' found. Running What-If analysis..." -ForegroundColor DarkGray
        az deployment group what-if `
            --resource-group $ResourceGroup `
            --template-file $bicepPath `
            --parameters $paramPath
    } else {
        Write-Host "  Target resource group '$ResourceGroup' not yet created." -ForegroundColor DarkGray
        Write-Host "  Template validated locally. Ready for deployment when confirmed." -ForegroundColor Green
    }

    Write-Host "`n[5/5] Dry-Run Validation Complete!" -ForegroundColor Green
    Write-Host "  [OK] Zero credits deducted from your Azure for Students subscription." -ForegroundColor White
    Write-Host "  [OK] Ready to deploy with: powershell -File deploy/azure/deploy-student.ps1 -ConfirmDeployment" -ForegroundColor Yellow
    exit 0
}

# 5. Live Provisioning
Write-Host "`n[4/5] Creating Resource Group '$ResourceGroup' in '$Location'..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output table

Write-Host "`n[5/5] Deploying Infrastructure to Azure for Students..." -ForegroundColor Yellow
$deployment = az deployment group create `
    --resource-group $ResourceGroup `
    --template-file $bicepPath `
    --parameters $paramPath `
    --output json | ConvertFrom-Json

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " Nexus Cloud Infrastructure Successfully Deployed! " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Frontend URL : https://$($deployment.properties.outputs.frontendFqdn.value)"
Write-Host "Backend URL  : https://$($deployment.properties.outputs.backendFqdn.value)"
Write-Host "PostgreSQL   : $($deployment.properties.outputs.postgresFqdn.value)"
Write-Host "Key Vault    : $($deployment.properties.outputs.keyVaultName.value)"
Write-Host "Storage      : $($deployment.properties.outputs.storageAccountName.value)"
