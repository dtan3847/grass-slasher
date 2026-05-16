import { test, expect } from '@playwright/test';

test('grass does not respawn when regrowth upgrade level is 0', async ({ page }) => {
  await page.goto('/?test=1');
  await page.waitForFunction(() => window.__test);

  await page.evaluate(() => {
    const t = window.__test;
    t.skipIntro();
    t.clearGrasses();
    t.player.x = 100;
    t.player.y = 100;
    t.upgrades.regrowth.level = 0;
    // Push a dead grass with a short respawn timer far from player
    t.grasses.push({
      x: 280, y: 200, alive: false,
      respawnTimer: 1, respawnTime: 1,
      hue: 100, flip: false, cutAnim: 0,
    });
  });

  // Tick enough frames for the timer to expire and respawn logic to run
  await page.evaluate(() => window.__test.tick(60));

  const alive = await page.evaluate(() => window.__test.grasses[0].alive);
  expect(alive).toBe(false);
});

test('grass respawns when regrowth upgrade level is 1', async ({ page }) => {
  await page.goto('/?test=1');
  await page.waitForFunction(() => window.__test);

  await page.evaluate(() => {
    const t = window.__test;
    t.skipIntro();
    t.clearGrasses();
    t.player.x = 100;
    t.player.y = 100;
    t.upgrades.regrowth.level = 1;
    t.grasses.push({
      x: 280, y: 200, alive: false,
      respawnTimer: 1, respawnTime: 1,
      hue: 100, flip: false, cutAnim: 0,
    });
  });

  await page.evaluate(() => window.__test.tick(60));

  const alive = await page.evaluate(() => window.__test.grasses[0].alive);
  expect(alive).toBe(true);
});
