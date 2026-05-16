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

test('lv1 magnet — gem 30px away is collected (range=50)', async ({ page }) => {
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

test('lv1 magnet — gem 65px away is not collected (outside range=50)', async ({ page }) => {
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

test('lv10 magnet — gem 95px away is collected (range=104)', async ({ page }) => {
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
    t.gems.push({ x: 175, y: 128, vx: 0, vy: 0, rest: true, amount: 1, tier: 0, baseValue: 1, life: 1800, bob: 0 });
  });

  await page.evaluate(() => window.__test.tick(300));

  const len = await page.evaluate(() => window.__test.gems.length);
  expect(len).toBe(0);
});

// magnetSword tests
// Player at (160, 128), facing right (facing=0). Right-facing arc sweeps from -PI/2 to 0,
// covering the top-right quadrant. slashRange=44 at lv0 upgrades.
// In-arc gem at (190, 98): angle atan2(-30, 30)=-PI/4, dist~42. Out-of-arc gem at (120, 128): angle PI.

test('lv0 magnetSword — slash hit does not pull gem', async ({ page }) => {
  await page.goto('/?test=1');
  await page.waitForFunction(() => window.__test);

  await page.evaluate(() => {
    const t = window.__test;
    t.skipIntro();
    t.clearGrasses();
    t.gems.length = 0;
    t.player.x = 160;
    t.player.y = 128;
    t.player.facing = 0;
    t.player.slashState = 'idle';
    t.player.slashTimer = 0;
    t.setUpgradeLevel('magnet', 0);
    t.setUpgradeLevel('magnetSword', 0);
    // gem in the top-right arc quadrant, within slashRange=44
    t.gems.push({ x: 190, y: 98, vx: 0, vy: 0, rest: true, amount: 1, tier: 0, baseValue: 1, life: 1800, bob: 0 });
  });

  await page.evaluate(() => {
    window.__test.keydown('Space');
    window.__test.tick(60);
  });

  const len = await page.evaluate(() => window.__test.gems.length);
  expect(len).toBe(1);
});

test('lv1 magnetSword — gem in arc is pulled and collected', async ({ page }) => {
  await page.goto('/?test=1');
  await page.waitForFunction(() => window.__test);

  await page.evaluate(() => {
    const t = window.__test;
    t.skipIntro();
    t.clearGrasses();
    t.gems.length = 0;
    t.player.x = 160;
    t.player.y = 128;
    t.player.facing = 0;
    t.player.slashState = 'idle';
    t.player.slashTimer = 0;
    t.setUpgradeLevel('magnet', 0);
    t.setUpgradeLevel('magnetSword', 1);
    // gem in the top-right arc quadrant, within slashRange=44
    t.gems.push({ x: 190, y: 98, vx: 0, vy: 0, rest: true, amount: 1, tier: 0, baseValue: 1, life: 1800, bob: 0 });
  });

  await page.evaluate(() => {
    window.__test.keydown('Space');
    window.__test.tick(120);
  });

  const len = await page.evaluate(() => window.__test.gems.length);
  expect(len).toBe(0);
});

test('lv1 magnetSword — gem outside arc is not pulled', async ({ page }) => {
  await page.goto('/?test=1');
  await page.waitForFunction(() => window.__test);

  await page.evaluate(() => {
    const t = window.__test;
    t.skipIntro();
    t.clearGrasses();
    t.gems.length = 0;
    t.player.x = 160;
    t.player.y = 128;
    t.player.facing = 0;
    t.player.slashState = 'idle';
    t.player.slashTimer = 0;
    t.setUpgradeLevel('magnet', 0);
    t.setUpgradeLevel('magnetSword', 1);
    // gem behind the player (left side), angle=PI, outside the right-facing arc
    t.gems.push({ x: 120, y: 128, vx: 0, vy: 0, rest: true, amount: 1, tier: 0, baseValue: 1, life: 1800, bob: 0 });
  });

  await page.evaluate(() => {
    window.__test.keydown('Space');
    window.__test.tick(60);
  });

  const len = await page.evaluate(() => window.__test.gems.length);
  expect(len).toBe(1);
});
