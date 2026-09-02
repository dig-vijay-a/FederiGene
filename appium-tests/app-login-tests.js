const { remote } = require('webdriverio');

async function runMobileLoginTests() {
  const capabilities = {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Android Emulator',
    'appium:app': '/path/to/your/app.apk', // Replace with the actual path to your APK
    'appium:appActivity': '.MainActivity', // Replace with your app's main activity
    'appium:appPackage': 'com.federigene.app', // Replace with your app's package name
  };

  const wdOpts = {
    hostname: '127.0.0.1',
    port: 4723,
    logLevel: 'info',
    capabilities,
  };

  console.log('Connecting to Appium server...');
  const driver = await remote(wdOpts);

  try {
    console.log('Test 1: Attempting valid login on mobile app...');

    // Wait for the email input field and enter email
    // Adjust the accessibility ID or xpath according to your actual app
    const emailField = await driver.$('~email-input');
    await emailField.waitForDisplayed({ timeout: 5000 });
    await emailField.setValue('testuser@example.com');

    // Wait for the password input field and enter password
    const passwordField = await driver.$('~password-input');
    await passwordField.setValue('securepassword123');

    // Click the login button
    const loginButton = await driver.$('~login-button');
    await loginButton.click();

    // Verify successful login by checking if a dashboard element is visible
    const dashboardElement = await driver.$('~dashboard-header');
    await dashboardElement.waitForDisplayed({ timeout: 10000 });
    
    console.log('Test 1 Passed: Mobile App Valid Login successful.\n');

  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    // End the session
    await driver.deleteSession();
  }
}

if (require.main === module) {
  runMobileLoginTests();
}

module.exports = { runMobileLoginTests };
