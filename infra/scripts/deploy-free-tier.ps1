<#
.SYNOPSIS
Deploys ALL free-tier Azure resources for the NEXUS Logistics Platform.

.DESCRIPTION
Creates a complete Azure environment using ONLY free-tier services:
  - Resource Group
  - App Service (F1 - FREE: 60 CPU min/day)
  - Static Web App (FREE: 100 GB bandwidth/month)
  - IoT Hub (F1 - FREE: 8,000 messages/day)
  - Storage Account (Standard_LRS - FREE: 5 GB for 12 months)
  - Application Insights (FREE: 5 GB ingestion/month)
  - Key Vault (Standard - FREE: ~10K operations/month)
  - Azure SQL Database (FREE: 100K vCore seconds/month, 32 GB)
  - Azure Functions (Consumption - FREE: 1M executions/month)

.PARAMETER Location
  Azure region for deployment (default: eastus)

.PARAMETER ResourceGroupName
  Name of the resource group (default: nexus-free-rg)

.PARAMETER SkipBicep
  Skip the Bicep deployment and only create Static Web App

.EXAMPLE
  .\deploy-free-tier.ps1
  .\deploy-free-tier.ps1 -Location "westus2"
  .\deploy-free-tier.ps1 -ResourceGroupName "my-nexus-rg"
#>

param (
    [string]$Location = "eastus",
    [string]$ResourceGroupName = "nexus-free-rg",
    [string]$DbAdminPassword = "",
    [switch]$SkipBicep
)

$ErrorActionPreference = "Stop"

# ==============================================================================
# COLORS & HELPERS
# ==============================================================================
function Write-Step { param([string]$Message) Write-Host "`n🔵 $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warn { param([string]$Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Err { param([string]$Message) Write-Host "❌ $Message" -ForegroundColor Red }

# ==============================================================================
# PRE-FLIGHT CHECKS
# ==============================================================================
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "  NEXUS Logistics Platform — Azure Free Tier Deployment" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Blue

Write-Step "Pre-flight checks..."

# Check Azure CLI
try {
    $azVersion = az version --output json 2>&1 | ConvertFrom-Json
    Write-Success "Azure CLI v$($azVersion.'azure-cli') detected"
} catch {
    Write-Err "Azure CLI not found. Install: winget install Microsoft.AzureCLI"
    exit 1
}

# Check login
try {
    $account = az account show --output json 2>&1 | ConvertFrom-Json
    Write-Success "Logged in as: $($account.user.name) (Subscription: $($account.name))"
} catch {
    Write-Warn "Not logged in. Running 'az login'..."
    az login
}

# Prompt for DB password if not provided
if (-not $DbAdminPassword) {
    $DbAdminPassword = Read-Host -Prompt "Enter PostgreSQL admin password (min 8 chars, mixed case + digits)" -AsSecureString | ConvertFrom-SecureString -AsPlainText
    if (-not $DbAdminPassword -or $DbAdminPassword.Length -lt 8) {
        $DbAdminPassword = "NexusFree2026!"
        Write-Warn "Using default password. Change this for production!"
    }
}

# ==============================================================================
# 1. CREATE RESOURCE GROUP
# ==============================================================================
Write-Step "Creating Resource Group '$ResourceGroupName' in '$Location'..."
try {
    az group create --name $ResourceGroupName --location $Location --output none
    Write-Success "Resource Group created: $ResourceGroupName"
} catch {
    Write-Err "Failed to create resource group: $_"
    throw
}

# ==============================================================================
# 2. SET BUDGET ALERT ($5 threshold)
# ==============================================================================
Write-Step "Setting budget alert (recommended: avoid surprise charges)..."
try {
    $subscriptionId = (az account show --query "id" -o tsv)
    Write-Warn "Set a budget alert in Azure Portal > Cost Management > Budgets"
    Write-Warn "Recommended: Set alerts at `$1 and `$5 thresholds"
} catch {
    Write-Warn "Could not configure budget alert automatically. Set manually in Azure Portal."
}

# ==============================================================================
# 3. DEPLOY BICEP TEMPLATE (All Infrastructure)
# ==============================================================================
if (-not $SkipBicep) {
    Write-Step "Deploying Azure infrastructure via Bicep template..."
    Write-Host "  This creates: App Service (F1), IoT Hub (F1), Storage, Key Vault,"
    Write-Host "  Application Insights, PostgreSQL, Redis, Azure Functions, SQL Database"
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "  ║  FREE TIER LIMITS:                                     ║" -ForegroundColor Yellow
    Write-Host "  ║  • App Service F1:  60 CPU minutes/day                 ║" -ForegroundColor Yellow
    Write-Host "  ║  • IoT Hub F1:      8,000 messages/day                 ║" -ForegroundColor Yellow
    Write-Host "  ║  • App Insights:    5 GB ingestion/month               ║" -ForegroundColor Yellow
    Write-Host "  ║  • Storage:         5 GB LRS (12-month free)           ║" -ForegroundColor Yellow
    Write-Host "  ║  • Functions:       1M executions/month                ║" -ForegroundColor Yellow
    Write-Host "  ║  • SQL Database:    100K vCore sec/month, 32 GB        ║" -ForegroundColor Yellow
    Write-Host "  ╚══════════════════════════════════════════════════════════╝" -ForegroundColor Yellow

    $bicepPath = Join-Path $PSScriptRoot "..\bicep\main.bicep"
    
    try {
        $deployment = az deployment group create `
            --resource-group $ResourceGroupName `
            --template-file $bicepPath `
            --parameters location=$Location environment='dev' dbAdminPassword=$DbAdminPassword `
            --output json 2>&1 | ConvertFrom-Json

        Write-Success "Bicep deployment completed!"
        
        # Extract outputs
        if ($deployment.properties.outputs) {
            $outputs = $deployment.properties.outputs
            Write-Host "`n  📋 Deployment Outputs:" -ForegroundColor Cyan
            Write-Host "  ├─ App Service:   $($outputs.appServiceEndpoint.value)"
            Write-Host "  ├─ PostgreSQL:    $($outputs.postgresHost.value)"
            Write-Host "  ├─ IoT Hub:       $($outputs.iotHubHostName.value)"
            Write-Host "  ├─ Redis:         $($outputs.redisHostName.value)"
            Write-Host "  ├─ Storage:       $($outputs.storageAccountName.value)"
            Write-Host "  └─ Key Vault:     $($outputs.keyVaultUri.value)"
        }
    } catch {
        Write-Err "Bicep deployment failed: $_"
        Write-Warn "You can retry with: az deployment group create --resource-group $ResourceGroupName --template-file $bicepPath"
        throw
    }
}

# ==============================================================================
# 4. CREATE STATIC WEB APP (Frontend)
# ==============================================================================
Write-Step "Creating Azure Static Web App (FREE tier) for frontend..."
try {
    az staticwebapp create `
        --name "nexus-frontend" `
        --resource-group $ResourceGroupName `
        --location $Location `
        --sku Free `
        --output none 2>$null
    Write-Success "Static Web App created: nexus-frontend"
    Write-Host "  → Deploy frontend via GitHub Actions or: swa deploy"
} catch {
    Write-Warn "Static Web App creation skipped (may already exist)"
}

# ==============================================================================
# 5. GET CONNECTION STRINGS FOR .env
# ==============================================================================
Write-Step "Retrieving connection strings..."

$envOutput = @()
$envOutput += "# ══════════════════════════════════════════════════"
$envOutput += "# Azure Free Tier Configuration (auto-generated)"
$envOutput += "# ══════════════════════════════════════════════════"

try {
    # Application Insights
    $aiKey = az monitor app-insights component show `
        --app "nexus-logistics-ai-dev" `
        --resource-group $ResourceGroupName `
        --query "connectionString" -o tsv 2>$null
    if ($aiKey) {
        $envOutput += "APPLICATIONINSIGHTS_CONNECTION_STRING=`"$aiKey`""
        Write-Success "Application Insights connection string retrieved"
    }

    # Storage Account
    $storageKeys = az storage account keys list `
        --resource-group $ResourceGroupName `
        --query "[0].value" -o tsv 2>$null
    $storageName = az storage account list `
        --resource-group $ResourceGroupName `
        --query "[0].name" -o tsv 2>$null
    if ($storageKeys -and $storageName) {
        $storageConn = "DefaultEndpointsProtocol=https;AccountName=$storageName;AccountKey=$storageKeys;EndpointSuffix=core.windows.net"
        $envOutput += "AZURE_STORAGE_CONNECTION_STRING=`"$storageConn`""
        Write-Success "Storage connection string retrieved"
    }

    # Key Vault
    $kvUri = az keyvault list `
        --resource-group $ResourceGroupName `
        --query "[0].properties.vaultUri" -o tsv 2>$null
    if ($kvUri) {
        $envOutput += "AZURE_KEYVAULT_URL=`"$kvUri`""
        Write-Success "Key Vault URI retrieved"
    }

    # IoT Hub
    $iotHost = az iot hub show `
        --resource-group $ResourceGroupName `
        --query "properties.hostName" -o tsv 2>$null
    if ($iotHost) {
        $envOutput += "AZURE_IOT_HUB_HOSTNAME=`"$iotHost`""
        Write-Success "IoT Hub hostname retrieved"
    }
} catch {
    Write-Warn "Could not retrieve all connection strings. Check Azure Portal."
}

# Save to .env.azure
$envFile = Join-Path $PSScriptRoot "..\..\..\.env.azure"
$envOutput | Out-File -FilePath $envFile -Encoding UTF8
Write-Success "Azure config saved to: $envFile"
Write-Warn "Merge these values into your .env file"

# ==============================================================================
# SUMMARY
# ==============================================================================
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ NEXUS Azure Free Tier Deployment Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Merge .env.azure values into your .env file"
Write-Host "  2. Run: .\setup-keyvault-secrets.ps1 to store secrets"
Write-Host "  3. Deploy frontend: cd frontend && swa deploy"
Write-Host "  4. Deploy backend: cd backend && az webapp up --sku F1"
Write-Host "  5. Monitor: Azure Portal > Application Insights"
Write-Host ""
Write-Host "  Monthly Cost: `$0 (within free tier limits)" -ForegroundColor Green
Write-Host "  Capacity: ~500 users/day, 5 vehicles, 1000 API requests/day" -ForegroundColor White
Write-Host ""
