<#
.SYNOPSIS
Populates Azure Key Vault with all NEXUS secrets from .env file or interactive prompts.

.DESCRIPTION
Reads secrets from a .env file (or prompts interactively) and stores them securely
in Azure Key Vault. This ensures no secrets are stored in plain text in config files
or environment variables on production machines.

Secrets stored:
  DATABASE_URL, SECRET_KEY, GROQ_API_KEY, GEMINI_API_KEY, GEOAPIFY_API_KEY,
  CLERK_ISSUER, CLERK_WEBHOOK_SECRET, AZURE_STORAGE_CONNECTION_STRING,
  APPLICATIONINSIGHTS_CONNECTION_STRING, REDIS_URL

.PARAMETER KeyVaultName
  Name of the Azure Key Vault (e.g., "nexus-kv-dev")

.PARAMETER EnvFilePath
  Path to .env file to read secrets from (default: project root .env)

.PARAMETER Interactive
  Force interactive mode (prompt for each secret)

.EXAMPLE
  .\setup-keyvault-secrets.ps1 -KeyVaultName "nexus-kv-dev"
  .\setup-keyvault-secrets.ps1 -KeyVaultName "nexus-kv-dev" -EnvFilePath "..\..\..\.env"
  .\setup-keyvault-secrets.ps1 -KeyVaultName "nexus-kv-dev" -Interactive
#>

param (
    [Parameter(Mandatory=$true)]
    [string]$KeyVaultName,
    [string]$EnvFilePath = (Join-Path $PSScriptRoot "..\..\..\.env"),
    [switch]$Interactive
)

$ErrorActionPreference = "Stop"

# Secret name mapping: ENV_VAR_NAME -> Key Vault secret name (uses dashes)
$secretMap = @{
    "DATABASE_URL"                          = "database-url"
    "SECRET_KEY"                            = "secret-key"
    "GROQ_API_KEY"                          = "groq-api-key"
    "GEMINI_API_KEY"                        = "gemini-api-key"
    "GEOAPIFY_API_KEY"                      = "geoapify-api-key"
    "CLERK_ISSUER"                          = "clerk-issuer"
    "CLERK_JWKS_URL"                        = "clerk-jwks-url"
    "CLERK_WEBHOOK_SECRET"                  = "clerk-webhook-secret"
    "AZURE_STORAGE_CONNECTION_STRING"       = "azure-storage-connection-string"
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = "applicationinsights-connection-string"
    "REDIS_URL"                             = "redis-url"
    "SMTP_USER"                             = "smtp-user"
    "SMTP_PASSWORD"                         = "smtp-password"
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Blue
Write-Host "  NEXUS — Azure Key Vault Secret Setup" -ForegroundColor White
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Blue

# Verify Key Vault exists
Write-Host "`n🔵 Verifying Key Vault '$KeyVaultName'..." -ForegroundColor Cyan
try {
    $vaultInfo = az keyvault show --name $KeyVaultName --output json 2>&1 | ConvertFrom-Json
    Write-Host "✅ Key Vault found: $($vaultInfo.properties.vaultUri)" -ForegroundColor Green
} catch {
    Write-Host "❌ Key Vault '$KeyVaultName' not found. Create it first." -ForegroundColor Red
    exit 1
}

# Parse .env file if it exists and not in interactive mode
$envValues = @{}
if (-not $Interactive -and (Test-Path $EnvFilePath)) {
    Write-Host "`n🔵 Reading secrets from: $EnvFilePath" -ForegroundColor Cyan
    $envContent = Get-Content $EnvFilePath -ErrorAction SilentlyContinue
    foreach ($line in $envContent) {
        $line = $line.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line -split "=", 2
            $key = $parts[0].Trim()
            $value = $parts[1].Trim().Trim('"').Trim("'")
            if ($value -and $secretMap.ContainsKey($key)) {
                $envValues[$key] = $value
            }
        }
    }
    Write-Host "✅ Found $($envValues.Count) secrets in .env file" -ForegroundColor Green
} else {
    Write-Host "`n🔵 Interactive mode: You'll be prompted for each secret" -ForegroundColor Cyan
}

# Store secrets
$stored = 0
$skipped = 0

Write-Host "`n🔵 Storing secrets in Key Vault..." -ForegroundColor Cyan

foreach ($envKey in $secretMap.Keys) {
    $kvName = $secretMap[$envKey]
    $value = $null

    # Try .env first, then prompt
    if ($envValues.ContainsKey($envKey) -and $envValues[$envKey]) {
        $value = $envValues[$envKey]
        Write-Host "  📋 $kvName ← from .env ($envKey)" -ForegroundColor Gray
    } elseif ($Interactive) {
        $value = Read-Host "  Enter value for $kvName ($envKey) [Enter to skip]"
    }

    if ($value -and $value.Length -gt 0) {
        try {
            az keyvault secret set --vault-name $KeyVaultName --name $kvName --value $value --output none 2>$null
            Write-Host "  ✅ $kvName — stored" -ForegroundColor Green
            $stored++
        } catch {
            Write-Host "  ❌ $kvName — failed: $_" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⏭️  $kvName — skipped (empty)" -ForegroundColor DarkGray
        $skipped++
    }
}

# Summary
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ Key Vault Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  Stored: $stored secrets" -ForegroundColor White
Write-Host "  Skipped: $skipped secrets" -ForegroundColor DarkGray
Write-Host "  Vault: $KeyVaultName" -ForegroundColor White
Write-Host ""
Write-Host "  Your app can now read secrets via:" -ForegroundColor Cyan
Write-Host "    AZURE_KEYVAULT_URL=`"$($vaultInfo.properties.vaultUri)`"" -ForegroundColor White
Write-Host ""
