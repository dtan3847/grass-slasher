import { test, expect } from '@playwright/test';

test('slash kills grass directly to the right', async ({ page }) => {
  await page.goto('/?test=1');
  await page.waitForFunction(() => window.__test);

  await page.evaluate(() => {
    const t = window.__test;
    t.skipIntro();
    t.clearGrasses();
    t.player.x = 100;
    t.player.y = 100;
    t.player.facing = 0; // right
    t.player.slashState = 'idle';
    t.grasses.push({
      x: 130, y: 100, alive: true,
      respawnTimer: 0, respawnTime: 999999,
      hue: 100, flip: false,
    });
    t.press('Space');
    t.tick(20); // sweep is 8 frames + retract 5 — 20 is safe margin
  });

  const alive = await page.evaluate(() => window.__test.grasses[0].alive);
  expect(alive).toBe(false);
});
