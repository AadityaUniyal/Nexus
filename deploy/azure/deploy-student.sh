#!/usr/bin/env bash
# ==============================================================================
# Nexus Operational Intelligence - Azure for Students Deployment Script (Bash)
# ==============================================================================
set -euo pipefail

RESOURCE_GROUP="${1:-rg-nexus-student}"
LOCATION="${2:-eastus}"
CONFIRM="${3:-false}"

echo "=========================================================="
echo " Nexus Fleet OS - Azure for Students Cloud Orchestrator "
echo "=========================================================="

echo "[1/4] Verifying Azure CLI Session..."
ACCOUNT_JSON=$(az account show --output json)
echo "  ✓ Connected to Azure for Students: $(echo "$ACCOUNT_JSON" | grep -o '"name": "[^"]*' | head -1)"

echo "[2/4] Validating Bicep Infrastructure..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
az bicep build --file "$SCRIPT_DIR/main.bicep"
echo "  ✓ Bicep compilation verified successfully."

if [ "$CONFIRM" != "true" ]; then
    echo "[3/4] Credit Protection Mode (Dry-Run Only)"
    echo "  Cost: \$0.00 / Zero Credits Deducted."
    echo "  To provision live resources, run: ./deploy-student.sh $RESOURCE_GROUP $LOCATION true"
    exit 0
fi

echo "[3/4] Creating Resource Group: $RESOURCE_GROUP ($LOCATION)..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output table

echo "[4/4] Deploying Bicep Template..."
az deployment group create \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "$SCRIPT_DIR/main.bicep" \
    --parameters "$SCRIPT_DIR/azuredeploy.parameters.json" \
    --output table

echo "Deployment complete!"
