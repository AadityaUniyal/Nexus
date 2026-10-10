#!/usr/bin/env python3
"""
Verification script for Azure Maps using Microsoft Entra ID authentication.
Strictly follows Non-Negotiables:
- Zero API keys used.
- Zero hardcoded addresses or sample cities.
- Uses Entra ID bearer token via DefaultAzureCredential.
"""

import os
import sys
import json
import urllib.parse
import urllib.request
import subprocess
from azure.identity import DefaultAzureCredential


def get_maps_client_id() -> str:
    """Retrieve Azure Maps Account unique ID (x-ms-client-id)."""
    client_id = os.environ.get("AZURE_MAPS_CLIENT_ID")
    if client_id:
        return client_id.strip()

    # Fallback to discovering client ID via az CLI if logged in
    try:
        result = subprocess.run(
            ["az", "maps", "account", "list", "--query", "[0].properties.uniqueId", "-o", "tsv"],
            capture_output=True,
            text=True,
            check=True
        )
        discovered_id = result.stdout.strip()
        if discovered_id:
            return discovered_id
    except Exception as exc:
        pass

    raise RuntimeError(
        "Azure Maps Client ID not found. Set AZURE_MAPS_CLIENT_ID environment variable "
        "or ensure an Azure Maps account exists in the active subscription."
    )


def geocode_address(address: str) -> dict:
    """Geocode an address using Azure Maps Search REST API with Entra ID bearer token."""
    if not address or not address.strip():
        raise ValueError("An address string must be provided as the first argument.")

    maps_client_id = get_maps_client_id()

    # Acquire Entra token for Azure Maps scope
    credential = DefaultAzureCredential(exclude_interactive_browser_credential=False)
    token = credential.get_token("https://atlas.microsoft.com/.default").token

    encoded_query = urllib.parse.quote(address.strip())
    url = f"https://atlas.microsoft.com/search/address/json?api-version=1.0&query={encoded_query}"

    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "x-ms-client-id": maps_client_id,
            "User-Agent": "NEXUS-Maps-Verifier/1.0",
        },
        method="GET"
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            if response.status != 200:
                raise RuntimeError(f"Azure Maps API error: HTTP {response.status}")
            data = json.loads(response.read().decode("utf-8"))
            return data
    except urllib.error.HTTPError as http_err:
        err_body = http_err.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Azure Maps HTTP {http_err.code}: {err_body}") from http_err


def main():
    if len(sys.argv) < 2 or not sys.argv[1].strip():
        print("Usage: python scripts/azure/verify_maps.py \"<any address>\"", file=sys.stderr)
        sys.exit(1)

    target_address = sys.argv[1]
    print(f"Resolving address with Azure Maps (Entra Auth): {target_address}")

    try:
        result = geocode_address(target_address)
        results_list = result.get("results", [])
        if not results_list:
            print("No geocode results found for this query.")
            sys.exit(2)

        top_hit = results_list[0]
        pos = top_hit.get("position", {})
        addr = top_hit.get("address", {})

        print("\n--- Geocode Success ---")
        print(f"Formatted Address : {addr.get('freeformAddress')}")
        print(f"Latitude          : {pos.get('lat')}")
        print(f"Longitude         : {pos.get('lon')}")
        print(f"Country           : {addr.get('country')}")
        print(f"Score / Confidence: {top_hit.get('score')}")
        print("Authentication    : Entra ID OAuth 2.0 Bearer Token (Zero Key)")
        sys.exit(0)
    except Exception as err:
        print(f"Verification Failed: {err}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
