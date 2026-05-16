import { test } from '@playwright/test';

// expect: player walks right, slashes a grass tile directly to its right.
// Grass should pop, gem spawns, gem flies into player and disappears (auto-magnet).

test('slash → grass cut → gem pickup', async ({ page }) => {
  await page.goto('/?test=1');
  await page.waitForFunction(() => window.__test);

  await page.evaluate(() => {
    const t = window.__test;
    t.skipIntro();
    t.clearGrasses();
    t.player.x = 100;
    t.player.y = 100;
    t.player.facing = 0; // right
    t.grasses.push({
      x: 130, y: 100, alive: true,
      respawnTimer: 0, respawnTime: 999999,
      hue: 100, flip: false,
    });
    t.setUpgradeLevel('magnet', 5);
  });

  await page.waitForTimeout(1000);
  await page.evaluate(() => window.__test.press('Space'));
  await page.waitForTimeout(2000);
});
