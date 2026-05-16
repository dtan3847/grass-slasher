import { test, expect } from '@playwright/test';

// Regression test: at high slashRange, the arc sweep can skip past grass tiles
// that fall between two consecutive frame angles. The fix uses a swept-arc
// interval [prevSlashAngle, currentSlashAngle] so no tile is missed.

test('swept-arc fix: grass at outer edge between frame angles is cut', async ({ page }) => {
  await page.goto('/?test=1');
  await page.waitForFunction(() => window.__test);

  await page.evaluate(() => {
    const t = window.__test;
    t.skipIntro();
    t.clearGrasses();

    // slashRange at lv13 = 44 + 13*12 = 200px
    t.setUpgradeLevel('slashRange', 13);

    // Player at (160, 220), facing right (cardinal 0).
    // Arc sweeps from -PI/2 to 0 over 8 frames (step ~0.196 rad/frame).
    // halfAngTol at distance 200 is ~0.065 rad, so gap (0.196) >> 2*tol (0.13).
    // Grass placed at the midpoint angle between frame 0 and frame 1:
    //   angle = -PI/2 + PI/32 ≈ -1.473 rad, distance = 200
    //   gx ≈ 160 + 200*cos(-1.473) ≈ 180, gy ≈ 220 + 200*sin(-1.473) ≈ 21
    // Without the fix, both frame 0 (-PI/2) and frame 1 (-1.374) miss by ~0.099 rad.
    // With the fix, the swept interval covers this angle → hit.
    const angle = -Math.PI / 2 + Math.PI / 32;
    const dist = 200;
    t.player.x = 160;
    t.player.y = 220;
    t.player.facing = 0; // right
    t.player.lastHorizDir = 1;
    t.player.slashState = 'idle';

    const gx = 160 + dist * Math.cos(angle);
    const gy = 220 + dist * Math.sin(angle);
    t.grasses.push({
      x: gx, y: gy, alive: true,
      respawnTimer: 0, respawnTime: 999999,
      hue: 110, flip: false,
    });

    t.press('Space');
    t.tick(20); // 8 sweep + 5 retract + margin
  });

  const alive = await page.evaluate(() => window.__test.grasses[0].alive);
  expect(alive).toBe(false);
});

test('baseline unaffected: grass directly in arc path is still cut', async ({ page }) => {
  await page.goto('/?test=1');
  await page.waitForFunction(() => window.__test);

  await page.evaluate(() => {
    const t = window.__test;
    t.skipIntro();
    t.clearGrasses();

    t.setUpgradeLevel('slashRange', 13);

    // Grass placed exactly at angle 0 (end of right sweep), distance 100.
    // This is the easy case that always worked. Verify fix didn't break it.
    t.player.x = 160;
    t.player.y = 220;
    t.player.facing = 0;
    t.player.lastHorizDir = 1;
    t.player.slashState = 'idle';

    t.grasses.push({
      x: 260, y: 220, alive: true,
      respawnTimer: 0, respawnTime: 999999,
      hue: 110, flip: false,
    });

    t.press('Space');
    t.tick(20);
  });

  const alive = await page.evaluate(() => window.__test.grasses[0].alive);
  expect(alive).toBe(false);
});
