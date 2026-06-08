const { expect, test } = require('@playwright/test');

test.describe('app shell smoke', () => {
  test('renders the unauthenticated app and accepts auth input', async ({ page }, testInfo) => {
    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('#root')).not.toBeEmpty();
    await expect(page.locator('body')).toContainText(/Sign in|Email|Supply SGT/i);
    await expect(page.locator('body')).not.toContainText(/Compiled with problems|Module not found|webpack/i);

    const usernameInput = page.locator(
      'input[name="username"], input[name="email"], input[type="email"], input[type="text"]'
    ).first();
    await expect(usernameInput).toBeVisible();
    await usernameInput.fill('qa@example.com');
    await expect(usernameInput).toHaveValue('qa@example.com');

    await page.screenshot({
      path: testInfo.outputPath(`${testInfo.project.name}-home.png`),
      fullPage: false
    });

    expect(pageErrors, 'page runtime errors').toEqual([]);
    expect(consoleErrors, 'browser console errors').toEqual([]);
  });

  test('authenticates an existing user when e2e credentials are provided', async ({ page }, testInfo) => {
    const email = process.env.SUPPLY_SGT_E2E_EMAIL;
    const password = process.env.SUPPLY_SGT_E2E_PASSWORD;
    test.skip(!email || !password, 'Set SUPPLY_SGT_E2E_EMAIL and SUPPLY_SGT_E2E_PASSWORD to run login smoke.');

    const consoleErrors = [];
    const pageErrors = [];

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const usernameInput = page.locator(
      'input[name="username"], input[name="email"], input[type="email"], input[type="text"]'
    ).first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

    await usernameInput.fill(email);
    await passwordInput.fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    const signedInShell = page.locator('body').filter({
      hasText: /Update Your Profile|Home|Manage Equipment|Accountability/i
    });
    const rejectedCredentials = page.locator('body').filter({
      hasText: /Incorrect username or password|User does not exist/i
    });
    const authOutcome = await Promise.race([
      signedInShell.waitFor({ state: 'visible', timeout: 45 * 1000 }).then(() => 'signed-in'),
      rejectedCredentials.waitFor({ state: 'visible', timeout: 45 * 1000 }).then(() => 'rejected')
    ]);

    expect(
      authOutcome,
      authOutcome === 'rejected'
        ? 'Provided e2e credentials were rejected by Cognito.'
        : 'Sign-in did not reach the authenticated app shell.'
    ).toBe('signed-in');
    await expect(page.locator('body')).not.toContainText(/Incorrect username or password|User does not exist/i);

    await page.screenshot({
      path: testInfo.outputPath(`${testInfo.project.name}-authenticated.png`),
      fullPage: false
    });

    expect(pageErrors, 'page runtime errors').toEqual([]);
    expect(consoleErrors, 'browser console errors').toEqual([]);
  });
});
