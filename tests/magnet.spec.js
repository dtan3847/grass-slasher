import { test, expect } from '@playwright/test';

test('lv0 magnet — gem 20px away is not collected', async ({ page }) => {
  await page.goto('/?test=1');
  await page.waitForFunction(() => window.__test);

  await page.evaluate(() => {
    const t = window.__test;
    t.skipIntro();
    t.clearGrasses();
    t.gems.length = 0;
    t.player.x = 160;
    t.player.y = 128;
    t.setUpgradeLevel('magnet', 0);
    t.gems.push({ x: 180, y: 128, vx: 0, vy: 0, rest: true, amount: 1, tier: 0, baseValue: 1, life: 1800, bob: 0 });
  });

  await page.evaluate(() => window.__test.tick(120));

  const len = await page.evaluate(() => window.__test.gems.length);
  expect(len).toBe(1);
});

test('lv1 magnet — gem 30px away is collected (new range=56, old range=25)', async ({ page }) => {
  await page.goto('/?test=1');
  await page.waitForFunction(() => window.__test);

  await page.evaluate(() => {
    const t = window.__test;
    t.skipIntro();
    t.clearGrasses();
    t.gems.length = 0;
    t.player.x = 160;
    t.player.y = 128;
    t.setUpgradeLevel('magnet', 1);
    t.gems.push({ x: 190, y: 128, vx: 0, vy: 0, rest: true, amount: 1, tier: 0, baseValue: 1, life: 1800, bob: 0 });
  });

  await page.evaluate(() => window.__test.tick(120));

  const len = await page.evaluate(() => window.__test.gems.length);
  expect(len).toBe(0);
});

test('lv1 magnet — gem 65px away is not collected (outside new range=56)', async ({ page }) => {
  await page.goto('/?test=1');
  await page.waitForFunction(() => window.__test);

  await page.evaluate(() => {
    const t = window.__test;
    t.skipIntro();
    t.clearGrasses();
    t.gems.length = 0;
    t.player.x = 160;
    t.player.y = 128;
    t.setUpgradeLevel('magnet', 1);
    t.gems.push({ x: 225, y: 128, vx: 0, vy: 0, rest: true, amount: 1, tier: 0, baseValue: 1, life: 1800, bob: 0 });
  });

  await page.evaluate(() => window.__test.tick(120));

  const len = await page.evaluate(() => window.__test.gems.length);
  expect(len).toBe(1);
});

test('lv10 magnet — gem 150px away is collected (range=164)', async ({ page }) => {
  await page.goto('/?test=1');
  await page.waitForFunction(() => window.__test);

  await page.evaluate(() => {
    const t = window.__test;
    t.skipIntro();
    t.clearGrasses();
    t.gems.length = 0;
    t.player.x = 80;
    t.player.y = 128;
    t.setUpgradeLevel('magnet', 10);
    t.gems.push({ x: 230, y: 128, vx: 0, vy: 0, rest: true, amount: 1, tier: 0, baseValue: 1, life: 1800, bob: 0 });
  });

  await page.evaluate(() => window.__test.tick(300));

  const len = await page.evaluate(() => window.__test.gems.length);
  expect(len).toBe(0);
});
