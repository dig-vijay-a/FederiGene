const { Builder, By, until } = require('selenium-webdriver');

async function runLoginTests() {
  // Replace with the appropriate URL for your frontend
  const url = 'http://localhost:3000/login';

  let driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log('Navigating to login page...');
    await driver.get(url);

    // Test Case 1: Valid Login
    console.log('Test 1: Attempting valid login...');
    let emailField = await driver.wait(until.elementLocated(By.id('email')), 5000);
    await emailField.sendKeys('testuser@example.com');

    let passwordField = await driver.findElement(By.id('password'));
    await passwordField.sendKeys('securepassword123');

    let loginButton = await driver.findElement(By.css('button[type="submit"]'));
    await loginButton.click();

    // Add assertions based on successful login (e.g., checking URL or a welcome message)
    await driver.wait(until.urlContains('/dashboard'), 5000);
    console.log('Test 1 Passed: Valid Login successful.\n');

  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    await driver.quit();
  }
}

if (require.main === module) {
  runLoginTests();
}

module.exports = { runLoginTests };
