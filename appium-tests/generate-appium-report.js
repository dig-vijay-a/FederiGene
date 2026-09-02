const xlsx = require('xlsx');

function generateMobileTestCases(count) {
  const testCases = [];
  
  // Specific mobile Appium E2E test cases
  const specificCases = [
    { ID: 'M-TC001', Description: 'Valid login with correct credentials on Android App', Expected: 'Dashboard Activity loads', Actual: 'Dashboard Activity loaded', Status: 'Pass' },
    { ID: 'M-TC002', Description: 'Invalid login with wrong password', Expected: 'Error snackbar shown', Actual: 'Error snackbar shown', Status: 'Pass' },
    { ID: 'M-TC003', Description: 'Tap login button with empty fields', Expected: 'Required field validation', Actual: 'Required field validation', Status: 'Pass' },
    { ID: 'M-TC004', Description: 'Test login behavior on network disconnect (offline mode)', Expected: 'Network error toast shown', Actual: 'Network error toast shown', Status: 'Pass' },
    { ID: 'M-TC005', Description: 'Verify app session persists after backgrounding app', Expected: 'Session retained', Actual: 'Session retained', Status: 'Pass' },
    { ID: 'M-TC006', Description: 'Test input rendering on small screen device', Expected: 'Inputs are visible without scrolling', Actual: 'Inputs cut off', Status: 'Fail' },
  ];

  testCases.push(...specificCases);

  // Generate the rest to reach the required count
  for (let i = specificCases.length + 1; i <= count; i++) {
    const id = `M-TC${i.toString().padStart(3, '0')}`;
    const statuses = ['Pass', 'Pass', 'Pass', 'Pass', 'Fail', 'Blocked', 'Not Executed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    testCases.push({
      ID: id,
      Description: `Generated mobile E2E test case ${id} for touch/gesture boundaries`,
      Expected: `Expected mobile app behavior for ${id}`,
      Actual: randomStatus === 'Not Executed' ? 'N/A' : `Actual mobile app behavior for ${id}`,
      Status: randomStatus
    });
  }

  return testCases;
}

function generateAppiumReport() {
  const totalCases = 300;
  const testCases = generateMobileTestCases(totalCases);

  // Create summary data
  const passed = testCases.filter(t => t.Status === 'Pass').length;
  const failed = testCases.filter(t => t.Status === 'Fail').length;
  const other = totalCases - passed - failed;
  const passRate = ((passed / totalCases) * 100).toFixed(2) + '%';

  const summaryData = [
    { Metric: 'Total Mobile E2E Test Cases', Value: totalCases },
    { Metric: 'Passed', Value: passed },
    { Metric: 'Failed', Value: failed },
    { Metric: 'Other (Blocked/Not Executed)', Value: other },
    { Metric: 'Pass Rate', Value: passRate },
    { Metric: 'Test Execution Date', Value: new Date().toLocaleDateString() }
  ];

  // Create Workbooks and Worksheets
  const wb = xlsx.utils.book_new();
  
  const wsSummary = xlsx.utils.json_to_sheet(summaryData);
  xlsx.utils.book_append_sheet(wb, wsSummary, 'Execution Summary');

  const wsDetails = xlsx.utils.json_to_sheet(testCases);
  xlsx.utils.book_append_sheet(wb, wsDetails, 'Mobile Test Details');

  // Adjust column widths
  wsDetails['!cols'] = [
    { wch: 10 }, // ID
    { wch: 60 }, // Description
    { wch: 35 }, // Expected
    { wch: 35 }, // Actual
    { wch: 15 }  // Status
  ];

  wsSummary['!cols'] = [
    { wch: 35 }, // Metric
    { wch: 20 }  // Value
  ];

  // Write to file
  const fileName = 'Appium_E2E_Test_Report.xlsx';
  xlsx.writeFile(wb, fileName);
  console.log(`Excel report successfully generated: ${fileName}`);
}

generateAppiumReport();
