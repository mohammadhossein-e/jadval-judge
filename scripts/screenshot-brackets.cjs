const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });
  
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
  const htmlPath = path.join(__dirname, '..', 'docs', 'brackets.html');
  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(500);

  const screenshotsDir = path.join(__dirname, '..', 'docs', 'screenshots');
  const fs = require('fs');
  fs.mkdirSync(screenshotsDir, { recursive: true });

  const cards = page.locator('.bracket-card');
  const count = await cards.count();

  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    const h2 = card.locator('h2');
    const text = await h2.textContent();
    const slug = text
      ?.replace(/[^\w\s]/g, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-') ?? `bracket-${i}`;

    await card.screenshot({ path: path.join(screenshotsDir, `${slug}.png`) });
    console.log(`📸 ${slug}.png`);
  }

  await page.screenshot({ path: path.join(screenshotsDir, 'all-brackets-full.png'), fullPage: true });
  console.log('📸 all-brackets-full.png (full page)');

  await browser.close();
  console.log('\n✅ All screenshots saved to docs/screenshots/');
})();
