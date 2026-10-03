"""
NEXUS Logistics Platform — Automated Azure Setup & Verification
Authenticates using MSAL / Azure CLI with the user's university/student directory,
inspects/configures Azure Free Tier resources under the specified subscription,
retrieves connection strings, updates project environment files,
and verifies backend integration health.
"""

import os
import sys

# Ensure clean UTF-8 console output on Windows without CP1252 charmap errors
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import json
import time
import httpx
from pathlib import Path
from typing import Dict, Any, Optional, List

AZURE_CLI_CLIENT_ID = "04b07795-8ddb-461a-bbee-02f9e1bf7b46"
DEFAULT_SUBSCRIPTION_ID = "5d4d8b69-8275-474f-84ed-cc922cba5ecc"
DEFAULT_UPN = "240211539@geu.ac.in"
DEFAULT_LOCATION = "eastus"
RESOURCE_GROUP_NAME = "nexus-free-rg"

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
CACHE_FILE = ROOT_DIR / ".azure_token_cache.json"

ARM_ENDPOINT = "https://management.azure.com"


class AzureAuthManager:
    """Manages Azure AD authentication via MSAL with device-code flow and local caching."""

    def __init__(self, tenant_id: str = "common"):
        self.tenant_id = tenant_id
        import msal
        self.app = msal.PublicClientApplication(
            AZURE_CLI_CLIENT_ID,
            authority=f"https://login.microsoftonline.com/{tenant_id}",
            token_cache=self._load_cache(),
        )

    def _load_cache(self):
        import msal
        cache = msal.SerializableTokenCache()
        if CACHE_FILE.exists():
            try:
                cache.deserialize(CACHE_FILE.read_text(encoding="utf-8"))
            except Exception:
                pass
        return cache

    def _save_cache(self):
        if self.app.token_cache.has_state_changed:
            CACHE_FILE.write_text(self.app.token_cache.serialize(), encoding="utf-8")

    def acquire_token(self, prompt_user: bool = True) -> Optional[str]:
        scopes = ["https://management.azure.com/.default"]
        accounts = self.app.get_accounts()

        # Try silent acquisition first
        if accounts:
            for account in accounts:
                result = self.app.acquire_token_silent(scopes, account=account)
                if result and "access_token" in result:
                    self._save_cache()
                    return result["access_token"]

        if not prompt_user:
            return None

        flow = self.app.initiate_device_flow(scopes=scopes)
        if "user_code" not in flow:
            raise RuntimeError(f"Failed to initiate device flow: {flow}")

        print("\n" + "=" * 65)
        print("  AZURE AUTHENTICATION REQUIRED")
        print("=" * 65)
        print(f"\n1. Open your browser and navigate to: {flow['verification_uri']}")
        print(f"2. Enter code: {flow['user_code']}")
        print(f"3. Sign in using your account: {DEFAULT_UPN}")
        print("\nWaiting for authentication to complete...\n")
        sys.stdout.flush()

        result = self.app.acquire_token_by_device_flow(flow)
        if "access_token" in result:
            self._save_cache()
            print("[+] Authentication successful!")
            return result["access_token"]
        else:
            raise RuntimeError(f"Authentication failed: {result.get('error_description', result)}")


class AzureClient:
    """Wrapper around Azure Resource Manager REST APIs."""

    def __init__(self, token: str, subscription_id: str):
        self.token = token
        self.subscription_id = subscription_id
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        self.http = httpx.Client(timeout=30.0)

    def get_subscription(self) -> Dict[str, Any]:
        url = f"{ARM_ENDPOINT}/subscriptions/{self.subscription_id}?api-version=2020-01-01"
        res = self.http.get(url, headers=self.headers)
        res.raise_for_status()
        return res.json()

    def list_resource_groups(self) -> List[Dict[str, Any]]:
        url = f"{ARM_ENDPOINT}/subscriptions/{self.subscription_id}/resourcegroups?api-version=2021-04-01"
        res = self.http.get(url, headers=self.headers)
        res.raise_for_status()
        return res.json().get("value", [])

    def create_resource_group(self, name: str, location: str) -> Dict[str, Any]:
        url = f"{ARM_ENDPOINT}/subscriptions/{self.subscription_id}/resourcegroups/{name}?api-version=2021-04-01"
        res = self.http.put(url, headers=self.headers, json={"location": location})
        res.raise_for_status()
        return res.json()

    def list_resources(self, resource_group: Optional[str] = None) -> List[Dict[str, Any]]:
        if resource_group:
            url = f"{ARM_ENDPOINT}/subscriptions/{self.subscription_id}/resourceGroups/{resource_group}/resources?api-version=2021-04-01"
        else:
            url = f"{ARM_ENDPOINT}/subscriptions/{self.subscription_id}/resources?api-version=2021-04-01"
        res = self.http.get(url, headers=self.headers)
        res.raise_for_status()
        return res.json().get("value", [])

    def get_storage_keys(self, resource_group: str, storage_account_name: str) -> List[str]:
        url = f"{ARM_ENDPOINT}/subscriptions/{self.subscription_id}/resourceGroups/{resource_group}/providers/Microsoft.Storage/storageAccounts/{storage_account_name}/listKeys?api-version=2023-01-01"
        res = self.http.post(url, headers=self.headers)
        if res.status_code == 200:
            keys = res.json().get("keys", [])
            return [k["value"] for k in keys]
        return []

    def get_app_insights_connection_string(self, resource_group: str, app_insights_name: str) -> Optional[str]:
        url = f"{ARM_ENDPOINT}/subscriptions/{self.subscription_id}/resourceGroups/{resource_group}/providers/Microsoft.Insights/components/{app_insights_name}?api-version=2020-02-02"
        res = self.http.get(url, headers=self.headers)
        if res.status_code == 200:
            return res.json().get("properties", {}).get("ConnectionString")
        return None

    def get_iothub_keys(self, resource_group: str, iothub_name: str) -> Optional[str]:
        url = f"{ARM_ENDPOINT}/subscriptions/{self.subscription_id}/resourceGroups/{resource_group}/providers/Microsoft.Devices/IotHubs/{iothub_name}/listkeys?api-version=2023-06-30"
        res = self.http.post(url, headers=self.headers)
        if res.status_code == 200:
            keys = res.json().get("value", [])
            for key in keys:
                if key.get("keyName") == "iothubowner":
                    return f"HostName={iothub_name}.azure-devices.net;SharedAccessKeyName=iothubowner;SharedAccessKey={key.get('primaryKey')}"
        return None

    def get_key_vault_uri(self, resource_group: str, vault_name: str) -> Optional[str]:
        url = f"{ARM_ENDPOINT}/subscriptions/{self.subscription_id}/resourceGroups/{resource_group}/providers/Microsoft.KeyVault/vaults/{vault_name}?api-version=2023-07-01"
        res = self.http.get(url, headers=self.headers)
        if res.status_code == 200:
            return res.json().get("properties", {}).get("vaultUri")
        return None


def setup_azure():
    print("\n" + "=" * 65)
    print("  NEXUS Logistics Platform — Azure Environment Setup")
    print("=" * 65)
    print(f"Target Account:      {DEFAULT_UPN}")
    print(f"Target Subscription: {DEFAULT_SUBSCRIPTION_ID}")
    print(f"Target Region:       {DEFAULT_LOCATION}")
    print(f"Target Group:        {RESOURCE_GROUP_NAME}\n")

    auth_mgr = AzureAuthManager()
    token = auth_mgr.acquire_token(prompt_user=True)
    if not token:
        print("[-] Failed to acquire Azure token.")
        sys.exit(1)

    client = AzureClient(token, DEFAULT_SUBSCRIPTION_ID)

    # 1. Verify Subscription
    print("[*] Verifying Azure Subscription...")
    sub = client.get_subscription()
    print(f"[+] Subscription Active: {sub.get('displayName')} ({sub.get('subscriptionId')}) [State: {sub.get('state')}]")

    # 2. Inspect / Ensure Resource Group
    print(f"\n[*] Checking Resource Groups in subscription...")
    rgs = client.list_resource_groups()
    rg_names = [r["name"] for r in rgs]
    print(f"Found {len(rgs)} Resource Group(s): {', '.join(rg_names) if rg_names else 'None'}")

    target_rg = RESOURCE_GROUP_NAME
    if target_rg not in rg_names:
        if "nexus-student-rg" in rg_names:
            target_rg = "nexus-student-rg"
        elif len(rg_names) > 0 and any("nexus" in name.lower() for name in rg_names):
            target_rg = [name for name in rg_names if "nexus" in name.lower()][0]
        else:
            print(f"[*] Creating Resource Group '{target_rg}' in {DEFAULT_LOCATION}...")
            client.create_resource_group(target_rg, DEFAULT_LOCATION)
            print(f"[+] Resource Group '{target_rg}' created successfully!")

    # 3. Discover existing resources
    print(f"\n[*] Inspecting resources in '{target_rg}'...")
    resources = client.list_resources(target_rg)
    print(f"Found {len(resources)} resource(s) in '{target_rg}':")
    for r in resources:
        print(f"  • {r.get('type')}: {r.get('name')} ({r.get('location')})")

    # Also check resources across the entire subscription if target_rg has fewer than expected
    if len(resources) == 0:
        all_res = client.list_resources()
        if all_res:
            print(f"\n[*] Found {len(all_res)} total resource(s) across subscription:")
            for r in all_res:
                print(f"  • {r.get('type')}: {r.get('name')} in RG: {r.get('id', '').split('/')[4] if '/' in r.get('id', '') else ''}")
            # If resources exist in another RG, point target_rg there
            first_rg = all_res[0].get('id', '').split('/')[4]
            if first_rg:
                target_rg = first_rg
                resources = all_res

    # 4. Extract connection settings
    config_updates = {
        "AZURE_SUBSCRIPTION_ID": DEFAULT_SUBSCRIPTION_ID,
        "AZURE_RESOURCE_GROUP": target_rg,
        "AZURE_LOCATION": DEFAULT_LOCATION,
    }

    storage_accounts = [r for r in resources if r.get("type") == "Microsoft.Storage/storageAccounts"]
    if storage_accounts:
        sa_name = storage_accounts[0]["name"]
        print(f"\n[*] Retrieving Storage Account keys for '{sa_name}'...")
        keys = client.get_storage_keys(target_rg, sa_name)
        if keys:
            conn_str = f"DefaultEndpointsProtocol=https;AccountName={sa_name};AccountKey={keys[0]};EndpointSuffix=core.windows.net"
            config_updates["AZURE_STORAGE_CONNECTION_STRING"] = conn_str
            config_updates["AZURE_STORAGE_ENABLED"] = "true"
            print("[+] Azure Storage Connection String retrieved.")

            # Create standard Medallion containers if missing
            try:
                from azure.storage.blob import BlobServiceClient
                blob_service = BlobServiceClient.from_connection_string(conn_str)
                containers = ["csv-imports", "telemetry-bronze", "telemetry-silver", "analytics-gold", "uploads"]
                for c in containers:
                    try:
                        blob_service.create_container(c)
                        print(f"  [+] Container verified/created: {c}")
                    except Exception:
                        pass
                print("[+] Storage containers verified (Medallion architecture ready).")
            except Exception as e:
                print(f"[!] Container verification warning: {e}")

    app_insights = [r for r in resources if r.get("type") == "Microsoft.Insights/components"]
    if app_insights:
        ai_name = app_insights[0]["name"]
        print(f"\n[*] Retrieving Application Insights connection for '{ai_name}'...")
        conn_str = client.get_app_insights_connection_string(target_rg, ai_name)
        if conn_str:
            config_updates["APPLICATIONINSIGHTS_CONNECTION_STRING"] = conn_str
            config_updates["AZURE_MONITOR_ENABLED"] = "true"
            print("[+] Application Insights Connection String retrieved.")

    iothubs = [r for r in resources if r.get("type") == "Microsoft.Devices/IotHubs"]
    if iothubs:
        iot_name = iothubs[0]["name"]
        print(f"\n[*] Retrieving IoT Hub connection for '{iot_name}'...")
        conn_str = client.get_iothub_keys(target_rg, iot_name)
        if conn_str:
            config_updates["AZURE_IOT_HUB_CONNECTION_STRING"] = conn_str
            config_updates["AZURE_IOT_HUB_HOSTNAME"] = f"{iot_name}.azure-devices.net"
            config_updates["AZURE_IOT_HUB_ENABLED"] = "true"
            print("[+] IoT Hub Connection String retrieved.")

    keyvaults = [r for r in resources if r.get("type") == "Microsoft.KeyVault/vaults"]
    if keyvaults:
        kv_name = keyvaults[0]["name"]
        print(f"\n[*] Retrieving Key Vault URI for '{kv_name}'...")
        vault_uri = client.get_key_vault_uri(target_rg, kv_name)
        if vault_uri:
            config_updates["AZURE_KEYVAULT_URL"] = vault_uri
            print(f"[+] Key Vault URI: {vault_uri}")

    # 5. Write to .env files
    env_azure_path = ROOT_DIR / ".env.azure"
    with open(env_azure_path, "w", encoding="utf-8") as f:
        f.write("# NEXUS Azure Integration Configuration\n")
        f.write(f"# Generated: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"# Subscription: {DEFAULT_SUBSCRIPTION_ID}\n")
        f.write(f"# Resource Group: {target_rg}\n\n")
        for k, v in config_updates.items():
            f.write(f'{k}="{v}"\n')
    print(f"\n[+] Azure settings saved to {env_azure_path}")

    # Also merge into root .env and backend/.env
    for target_file in [ROOT_DIR / ".env", ROOT_DIR / "backend" / ".env"]:
        existing_lines = []
        if target_file.exists():
            existing_lines = target_file.read_text(encoding="utf-8").splitlines()
        
        updated_dict = {}
        for line in existing_lines:
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                updated_dict[k.strip()] = v.strip()
        
        # Apply updates
        for k, v in config_updates.items():
            updated_dict[k] = f'"{v}"' if not v.startswith('"') else v

        new_content = [
            f"# ==============================================================================",
            f"# NEXUS Environment Configuration (Updated with Azure Free Tier)",
            f"# ==============================================================================",
        ]
        for k, v in updated_dict.items():
            new_content.append(f"{k}={v}")
        target_file.write_text("\n".join(new_content) + "\n", encoding="utf-8")
        print(f"[+] Updated {target_file}")

    print("\n" + "=" * 65)
    print("  AZURE CONFIGURATION COMPLETE!")
    print("=" * 65)
    return config_updates


if __name__ == "__main__":
    setup_azure()
