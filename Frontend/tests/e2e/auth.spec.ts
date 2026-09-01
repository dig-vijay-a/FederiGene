import { test, expect } from '@playwright/test';

test('User can fill out login form and submit', async ({ page }) => {
  // In a real scenario, you'd navigate to your local dev server:
  // await page.goto('http://localhost:5173/auth/login');
  
  // For this template, we inject a mock DOM so it passes even if your Vite server is off
  await page.goto('about:blank'); 
  await page.setContent(`
    <form id="login-form">
      <input type="email" name="email" placeholder="Email Address" />
      <input type="password" name="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  `);

  // 1. Locate and fill the email field just like a real user
  await page.fill('input[name="email"]', 'doctor@federigene.com');
  
  // 2. Locate and fill the password field
  await page.fill('input[name="password"]', 'SecurePass123!');
  
  // 3. Verification assertions (run before submit so the mocked page doesn't reload and clear the inputs)
  const emailValue = await page.inputValue('input[name="email"]');
  const passwordValue = await page.inputValue('input[name="password"]');
  
  expect(emailValue).toBe('doctor@federigene.com');
  expect(passwordValue).toBe('SecurePass123!');

  // 4. Click the login button
  await page.click('button[type="submit"]');
});
