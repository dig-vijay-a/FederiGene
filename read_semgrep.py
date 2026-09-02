import json

try:
    with open('semgrep-results.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    errors = [r for r in data.get('results', []) if r.get('extra', {}).get('severity', '').upper() == 'ERROR']
    
    if not errors:
        print("No critical errors found!")
    else:
        for err in errors:
            print(f"File: {err.get('path')}:{err.get('start', {}).get('line')}")
            print(f"Message: {err.get('extra', {}).get('message')}")
            print("-" * 40)
except Exception as e:
    print(f"Error reading results: {e}")
