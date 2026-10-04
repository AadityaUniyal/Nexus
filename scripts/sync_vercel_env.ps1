$ErrorActionPreference = "Stop"
$Global:PSNativeCommandUseErrorActionPreference = $false

$keys = @(
  "DATABASE_URL",
  "SECRET_KEY",
  "APP_ENV",
  "GROQ_API_KEY",
  "GROQ_MODEL",
  "GEMINI_API_KEY",
  "GEMINI_MODEL",
  "GEOAPIFY_API_KEY",
  "GEOAPIFY_BASE_URL",
  "LOCATION_PROVIDER",
  "CLERK_ISSUER",
  "CLERK_JWKS_URL",
  "CLERK_WEBHOOK_SECRET",
  "CORS_ORIGINS",
  "FRONTEND_URL",
  "REDIS_URL"
)

$envFiles = @(".env", ".env.local", "backend/.env")
$values = @{}

foreach ($file in $envFiles) {
  if (-not (Test-Path $file)) {
    continue
  }

  foreach ($line in Get-Content $file) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith("#") -or -not $trimmed.Contains("=")) {
      continue
    }

    $separator = $trimmed.IndexOf("=")
    $name = $trimmed.Substring(0, $separator).Trim()
    $value = $trimmed.Substring($separator + 1).Trim()

    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    $looksLocal = $value.Contains("localhost") -or $value.Contains("127.0.0.1")
    $looksPlaceholder = $value.Contains("replace_with") -or $value.EndsWith("_...")

    if ($keys -contains $name -and $value -and -not $looksLocal -and -not $looksPlaceholder) {
      $values[$name] = $value
    }
  }
}

foreach ($key in $keys) {
  if (-not $values.ContainsKey($key)) {
    continue
  }

  $tempFile = New-TemporaryFile
  Set-Content -LiteralPath $tempFile -Value $values[$key] -NoNewline

  try {
    $previousErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $output = Get-Content -Raw -LiteralPath $tempFile | npx vercel env add $key production 2>&1
    $ErrorActionPreference = $previousErrorAction
    $text = $output | Out-String
    if ($LASTEXITCODE -eq 0) {
      Write-Output "added:$key"
    } elseif ($text -match "already exists") {
      Write-Output "exists:$key"
    } else {
      throw "Failed to add $key"
    }
  } finally {
    Remove-Item -LiteralPath $tempFile -Force -ErrorAction SilentlyContinue
  }
}
