import pandas as pd
import json

results = {}
for f in ['Appium_E2E_Test_Report.xlsx', 'Selenium_E2E_Test_Report.xlsx']:
    try:
        xl = pd.ExcelFile(f)
        sheet_name = 'Mobile Test Details' if 'Appium' in f else 'Test Details'
        df = pd.read_excel(f, sheet_name=sheet_name)
        failures = df[df['Status'].isin(['Fail', 'Blocked', 'Not Executed'])]
        
        file_failures = []
        for index, row in failures.iterrows():
            file_failures.append({
                'Test Name': row.get('Test Name', 'N/A'),
                'Status': row.get('Status', 'N/A'),
                'Error Message': row.get('Error Message', 'N/A')
            })
        results[f] = file_failures
    except Exception as e:
        results[f] = {'error': str(e)}

with open('failures.json', 'w') as out:
    json.dump(results, out, indent=2)
