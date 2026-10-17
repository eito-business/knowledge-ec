import { test, expect } from '@playwright/test';

test.describe('Home の基本的なナビゲーション', () => {
  test('トップページが正しくレンダリングされることを確認', async ({ page }) => {
    // トップページへアクセス
    await page.goto('/');

    // ヘッダータイトルのチェック
    const title = page.locator('h1').first();
    await expect(title).toBeVisible();
    await expect(title).toContainText('自分にぴったりの教材');

    // サブタイトルのチェック
    const subtitle = page.locator('p.text-xl.text-muted-foreground');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toContainText(
      'プログラミング学習に役立つリソースのコレクション'
    );
  });

  test('特集コンテンツが正しく表示されることを確認', async ({ page }) => {
    await page.goto('/');

    // 特集コンテンツ（カード）
    const featuredContent = page
      .locator('div.card, div[class*="card"]')
      .filter({ hasText: 'Premium' })
      .first();
    await expect(featuredContent).toBeVisible();

    // 特集コンテンツのタイトル
    const featuredTitle = featuredContent.locator('h2').first();
    await expect(featuredTitle).toContainText(
      'ToDo アプリで理解するReact useState'
    );

    // 価格表示
    const priceText = featuredContent.locator('text=￥1,800');
    await expect(priceText).toBeVisible();

    // 購入ボタン
    const buyButton = featuredContent.locator(
      'button:has-text("今すぐ購入する")'
    );
    await expect(buyButton).toBeVisible();
  });

  test('ナビゲーションバーが正しく表示されることを確認', async ({ page }) => {
    await page.goto('/');

    // ナビゲーションバー
    const navbar = page.locator('nav').first();
    await expect(navbar).toBeVisible();

    // サイト名
    await expect(navbar).toContainText('Knowledge EC');
  });

  test('記事の一覧が正しく表示されることを確認', async ({ page }) => {
    await page.goto('/');

    // 記事リストの取得
    const articleCards = page.locator(
      'div.group.relative div.flex.gap-4.overflow-x-auto.scrollbar-hide.scroll-smooth div'
    );

    // 記事カードの数を確認
    const cardsCount = await articleCards.count();
    expect(cardsCount).toBeGreaterThanOrEqual(3);

    // 先頭の記事タイトルの確認
    const firstArticleTitle = articleCards
      .nth(0)
      .locator('div[data-slot="card-title"]');
    await expect(firstArticleTitle).toContainText('NextAuth.js とは？');

    // タグが表示されていることを確認
    const tags = articleCards.nth(0).locator('span[data-slot="badge"]');
    await expect(tags.nth(0)).toContainText('nextjs'); // 修正済
  });

  test('本の一覧が正しく表示されることを確認', async ({ page }) => {
    await page.goto('/');

    // 本リストの取得
    const bookCards = page.locator(
      'div.flex.gap-4 div.relative a[href^="/books/"]'
    );

    // 本カードの数を確認
    const cardsCount = await bookCards.count();
    expect(cardsCount).toBeGreaterThanOrEqual(2);

    // 先頭の本のタイトル確認
    const firstBookTitle = bookCards.nth(0).locator('h3[data-slot="title"]');
    await expect(firstBookTitle).toContainText(
      'ToDo アプリで理解するReact useState'
    );

    // 章の数が表示されていることを確認
    await expect(bookCards.nth(0)).toContainText('全11章');

    // 2冊目の本の価格が表示されていることを確認
    const secondBookPrice = bookCards.nth(1).locator('text=￥1,200');
    await expect(secondBookPrice).toBeVisible();
  });
});
