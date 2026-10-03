"""
Deploy NEXUS Backend to Azure App Service via Kudu ZipDeploy
Packages backend code, configurations, and requirements into a clean zip archive
and uploads to the active Azure Web App.
"""

import os
import sys
import zipfile
import tempfile
import httpx
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from infra.scripts.setup_azure_project import AzureAuthManager, AzureClient, ARM_ENDPOINT

SUBSCRIPTION_ID = "5d4d8b69-8275-474f-84ed-cc922cba5ecc"
RESOURCE_GROUP = "nexus-api-prod_group"
APP_NAME = "nexus-api-prod"


def create_deployment_zip() -> Path:
    zip_path = Path(tempfile.gettempdir()) / "nexus_backend_deploy.zip"
    if zip_path.exists():
        zip_path.unlink()

    print(f"[*] Packaging backend files into {zip_path}...")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        # Add root main.py
        main_py = ROOT_DIR / "main.py"
        if main_py.exists():
            zf.write(main_py, arcname="main.py")

        # Add requirements.txt
        req_file = ROOT_DIR / "requirements.txt"
        if req_file.exists():
            zf.write(req_file, arcname="requirements.txt")

        # Add .env
        env_file = ROOT_DIR / "backend" / ".env"
        if env_file.exists():
            zf.write(env_file, arcname=".env")
            zf.write(env_file, arcname="backend/.env")

        # Add backend directory recursively
        backend_dir = ROOT_DIR / "backend"
        for file_path in backend_dir.rglob("*"):
            if file_path.is_file():
                # Skip pycache and tests
                parts = file_path.parts
                if "__pycache__" in parts or ".pytest_cache" in parts:
                    continue
                rel_path = file_path.relative_to(ROOT_DIR)
                zf.write(file_path, arcname=str(rel_path).replace("\\", "/"))

    size_mb = zip_path.stat().st_size / (1024 * 1024)
    print(f"[+] Archive created successfully: {size_mb:.2f} MB")
    return zip_path


def deploy_zip():
    print("=" * 65)
    print("  NEXUS Backend — Azure App Service Zip Deployment")
    print("=" * 65)

    auth = AzureAuthManager()
    token = auth.acquire_token(prompt_user=False)
    client = AzureClient(token, SUBSCRIPTION_ID)

    # 1. Fetch publishing credentials
    print("[*] Retrieving Azure App Service publishing profile...")
    xml_url = f"{ARM_ENDPOINT}/subscriptions/{SUBSCRIPTION_ID}/resourceGroups/{RESOURCE_GROUP}/providers/Microsoft.Web/sites/{APP_NAME}/publishxml?api-version=2022-09-01"
    res = client.http.post(xml_url, headers=client.headers)
    res.raise_for_status()

    root = ET.fromstring(res.text)
    user = None
    pwd = None
    for p in root.findall("publishProfile"):
        if p.get("publishMethod") == "MSDeploy":
            user = p.get("userName")
            pwd = p.get("userPWD")
            break

    if not user or not pwd:
        raise RuntimeError("Failed to extract MSDeploy publishing credentials from Azure.")

    print(f"[+] Authenticated as publishing user: {user}")

    # Get SCM Hostname
    site_info = client.http.get(f"{ARM_ENDPOINT}/subscriptions/{SUBSCRIPTION_ID}/resourceGroups/{RESOURCE_GROUP}/providers/Microsoft.Web/sites/{APP_NAME}?api-version=2022-09-01", headers=client.headers).json()
    enabled_hosts = site_info.get("properties", {}).get("enabledHostNames", [])
    scm_host = None
    for h in enabled_hosts:
        if ".scm." in h:
            scm_host = h
            break
    if not scm_host:
        scm_host = f"{APP_NAME}-adfjh5fvabd6cpgv.scm.austriaeast-01.azurewebsites.net"

    print(f"[+] SCM Host identified: {scm_host}")

    # 2. Package zip
    zip_path = create_deployment_zip()

    # 3. Upload to Kudu zipdeploy
    kudu_deploy_url = f"https://{scm_host}/api/zipdeploy?isAsync=true"
    print(f"[*] Uploading payload to Kudu: {kudu_deploy_url}...")

    with open(zip_path, "rb") as f:
        data = f.read()

    deploy_http = httpx.Client(timeout=180.0)
    upload_res = deploy_http.post(
        kudu_deploy_url,
        auth=(user, pwd),
        content=data,
        headers={"Content-Type": "application/zip"},
    )
    print(f"[*] Upload Status: {upload_res.status_code}")
    if upload_res.status_code in [200, 202]:
        print("[+] Zip deployment accepted by Azure!")
    else:
        print(f"[-] Deployment response: {upload_res.text}")
        sys.exit(1)

    # 4. Poll deployment status
    status_url = f"https://{scm_host}/api/deployments/latest"
    print("[*] Waiting for deployment to finalize on Azure...")
    import time
    for i in range(12):
        time.sleep(5)
        try:
            s_res = deploy_http.get(status_url, auth=(user, pwd), timeout=10.0)
            if s_res.status_code == 200:
                s_data = s_res.json()
                status = s_data.get("status")
                msg = s_data.get("message")
                print(f"  Attempt {i+1}: status={status} ({msg})")
                if status == 4:  # Success
                    print("[+] Deployment completed successfully on Azure!")
                    break
                elif status == 3:  # Failed
                    print(f"[-] Deployment failed: {msg}")
                    break
        except Exception:
            pass

    print("\n" + "=" * 65)
    print(f"  AZURE BACKEND DEPLOYMENT COMPLETE: https://{APP_NAME}-adfjh5fvabd6cpgv.austriaeast-01.azurewebsites.net")
    print("=" * 65)


if __name__ == "__main__":
    deploy_zip()
