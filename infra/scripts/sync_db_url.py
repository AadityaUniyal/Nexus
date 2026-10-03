import sys
sys.path.insert(0, ".")
from infra.scripts.setup_azure_project import AzureAuthManager, AzureClient, ARM_ENDPOINT
from pathlib import Path

auth = AzureAuthManager()
token = auth.acquire_token(prompt_user=False)
client = AzureClient(token, '5d4d8b69-8275-474f-84ed-cc922cba5ecc')

sub_id = '5d4d8b69-8275-474f-84ed-cc922cba5ecc'
rg = 'nexus-api-prod_group'

res = client.http.post(f'{ARM_ENDPOINT}/subscriptions/{sub_id}/resourceGroups/{rg}/providers/Microsoft.Web/sites/nexus-api-prod/config/appsettings/list?api-version=2022-09-01', headers=client.headers)
props = res.json().get('properties', {})
db_url = props.get('DATABASE_URL')
print('Found DATABASE_URL in AppSettings:', bool(db_url))

root = Path('.')
for p in [root / '.env', root / 'backend' / '.env']:
    if p.exists() and db_url:
        lines = p.read_text(encoding='utf-8').splitlines()
        new_lines = []
        for line in lines:
            if line.startswith('DATABASE_URL='):
                new_lines.append(f'DATABASE_URL="{db_url}"')
            else:
                new_lines.append(line)
        p.write_text('\n'.join(new_lines) + '\n', encoding='utf-8')
        print(f'Updated {p} with production DATABASE_URL')
