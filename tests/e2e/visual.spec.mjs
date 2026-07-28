import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const stylePath = path.join(testDirectory, 'visual-mask.css');

async function login(page) {
  await page.goto('/');
  await page.locator('#input-login-username').fill('quality-admin');
  await page.locator('#input-login-password').fill('Quality-Only-Password-2026!');
  await page.locator('#form-login').getByRole('button', { name: 'Entrar no painel' }).click();
  await expect(page.locator('#btn-nav-dashboard')).toBeVisible();
  await expect(page.locator('.service-toolbar')).toBeVisible();
}

async function expectNoHorizontalOverflow(page) {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
}

test('login theme choice persists and styles the authenticated app', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 950, height: 900 });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page).toHaveScreenshot('login-dark-950.png', { stylePath });

  const themeToggle = page.locator('[data-theme-toggle]');
  const themeThumb = page.locator('.theme-toggle-thumb');
  await expect(themeToggle).toHaveAttribute('aria-checked', 'true');
  const darkThumbBox = await themeThumb.boundingBox();
  await themeToggle.click();
  await page.waitForTimeout(100);
  const movingThumbBox = await themeThumb.boundingBox();
  await page.waitForTimeout(420);
  const lightThumbBox = await themeThumb.boundingBox();
  expect(darkThumbBox).not.toBeNull();
  expect(movingThumbBox).not.toBeNull();
  expect(lightThumbBox).not.toBeNull();
  expect(movingThumbBox.x).toBeLessThan(darkThumbBox.x);
  expect(movingThumbBox.x).toBeGreaterThan(lightThumbBox.x);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(themeToggle).toHaveAttribute('aria-checked', 'false');
  const loginButtonBox = await page.locator('#btn-login-submit').boundingBox();
  expect(loginButtonBox).not.toBeNull();
  expect(loginButtonBox.width).toBeGreaterThan(340);
  await expect(page).toHaveScreenshot('login-light-950.png', { stylePath });

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.locator('#input-login-username').fill('quality-admin');
  await page.locator('#input-login-password').fill('Quality-Only-Password-2026!');
  await page.locator('#form-login').getByRole('button', { name: 'Entrar no painel' }).click();
  await expect(page.locator('#btn-nav-dashboard')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('tablet-dashboard-light-950.png', { stylePath });
});

test('desktop dashboard and manager remain visually stable', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('desktop-dashboard.png', { stylePath });

  await page.locator('[data-action="details"]').first().click();
  await expect(page.locator('.client-details-modal')).toBeVisible();
  await expect(page.locator('html')).not.toHaveClass(/client-details-transition/);
  await expect(page).toHaveScreenshot('desktop-client-details.png', { stylePath });
  await page.locator('#btn-close-modal').click();
  await expect(page.locator('.client-details-modal')).toBeHidden();

  await page.locator('#btn-nav-manager').click();
  await page.locator('[data-manager-subtab="usuarios"]').click();
  await expect(page.locator('[aria-selected="true"]')).toContainText('Usuários');
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('desktop-manager-users.png', { stylePath });
});

test('compact mobile flows remain readable and contained', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await login(page);
  await expect(page.locator('.brand-name-compact')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('mobile-dashboard-360.png', { stylePath });

  await page.locator('[data-action="open-edit-client"]').first().click();
  const editPanel = page.locator('.edit-client-panel');
  await expect(editPanel).toBeVisible();
  const editBox = await editPanel.boundingBox();
  expect(editBox).not.toBeNull();
  expect(editBox.width).toBeLessThanOrEqual(336);
  expect(editBox.height).toBeLessThan(776);
  await expect(page).toHaveScreenshot('mobile-edit-client-360.png', { stylePath });
  await page.locator('#btn-close-modal').click();
  await expect(editPanel).toBeHidden();

  await page.locator('#btn-nav-manager').click();
  await page.locator('[data-manager-subtab="usuarios"]').click();
  await expect(page.locator('[aria-selected="true"]')).toContainText('Usuários');
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('mobile-manager-users-360.png', { stylePath });

  await page.locator('[data-action="add-user"]').click();
  await expect(page.locator('[role="dialog"]')).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expect(page).toHaveScreenshot('mobile-user-modal-360.png', { stylePath });
});

test('tablet header keeps controls compact without a third utility row', async ({ page }) => {
  await page.setViewportSize({ width: 950, height: 900 });
  await login(page);
  await expectNoHorizontalOverflow(page);

  const headerHeight = await page.locator('.app-header').evaluate(element => (
    element.getBoundingClientRect().height
  ));
  expect(headerHeight).toBeLessThan(190);

  const brandBox = await page.locator('.mobile-brand').boundingBox();
  const actionsBox = await page.locator('.mobile-nav-actions').boundingBox();
  expect(brandBox).not.toBeNull();
  expect(actionsBox).not.toBeNull();
  expect(Math.abs(brandBox.y - actionsBox.y)).toBeLessThan(8);

  await expect(page).toHaveScreenshot('tablet-dashboard-950.png', { stylePath });
});

test('responsive boundaries remain contained', async ({ page }) => {
  const viewports = [
    { width: 500, height: 900, snapshot: 'mobile-dashboard-500.png' },
    { width: 700, height: 900, snapshot: 'tablet-dashboard-700.png' },
    { width: 768, height: 900, snapshot: 'tablet-dashboard-768.png' }
  ];

  await page.setViewportSize(viewports[0]);
  await login(page);

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await expectNoHorizontalOverflow(page);
    await expect(page.locator('.service-toolbar')).toBeVisible();

    if (viewport.width >= 640) {
      const brandBox = await page.locator('.mobile-brand').boundingBox();
      const actionsBox = await page.locator('.mobile-nav-actions').boundingBox();
      expect(brandBox).not.toBeNull();
      expect(actionsBox).not.toBeNull();
      expect(Math.abs(brandBox.y - actionsBox.y)).toBeLessThan(8);
    }

    await expect(page).toHaveScreenshot(viewport.snapshot, { stylePath });
  }
});
