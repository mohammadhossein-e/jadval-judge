import { chromium } from 'playwright';
import { join } from 'path';

const htmlPath = join(import.meta.dirname ?? '.', '..', 'docs', 'brackets.html');
const screenshotsDir = join(import.meta.dirname ?? '.', '..', 'docs', 'screenshots');

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });

  await page.goto(`file://${htmlPath}`);
  await page.waitForTimeout(500);

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

    await card.screenshot({ path: join(screenshotsDir, `${slug}.png`) });
    console.log(`📸 ${slug}.png`);
  }

  // Also take a full page screenshot
  await page.screenshot({ path: join(screenshotsDir, 'all-brackets-full.png'), fullPage: true });
  console.log(`📸 all-brackets-full.png (full page)`);

  await browser.close();
  console.log('\n✅ All screenshots saved to docs/screenshots/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
