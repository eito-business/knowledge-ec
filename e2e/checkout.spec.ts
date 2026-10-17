import { test, expect } from '@playwright/test';
import { MOCK_PURCHASES_COOKIE } from './mocks/purchase-data';

test.describe('決済フロー', () => {
  // 未ログイン状態で購入ボタンをクリック
  test('未ログイン状態で購入ボタンをクリックしたら、ログインページへリダイレクト', async ({
    page,
    context,
  }) => {
    // Cookieをクリアして未認証状態にする
    await context.clearCookies();

    await page.goto('/');

    // 特集コンテンツ
    const featuredContent = page
      .locator('div.card, div[class*="card"]')
      .filter({ hasText: 'Premium' })
      .first();
    await expect(featuredContent).toBeVisible();

    // 購入ボタンが表示されていることを確認
    const purchaseButton = featuredContent
      .locator('button:has-text("今すぐ購入する")')
      .first();
    await expect(purchaseButton).toBeVisible();

    // 購入ボタンをクリック
    await purchaseButton.click();

    // アラートで「認証が必要です」と出るので、OKをクリック
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // 少し待つ
    await page.waitForURL(/\/api\/auth\/signin/);

    // ログインページにリダイレクトされていることを確認（GitHubボタンの存在）
    const githubButton = page.locator('button:has-text("Sign in with GitHub")');
    await expect(githubButton).toBeVisible();
  });

  test('ログイン状態で、正常にコンテンツを購入できることを確認', async ({
    page,
  }) => {
    await page.goto('/');

    // 特集コンテンツ
    const featuredContent = page
      .locator('div.card, div[class*="card"]')
      .filter({ hasText: 'Premium' })
      .first();

    // 購入ボタンが表示されていることを確認
    const purchaseButton = featuredContent
      .locator('button:has-text("今すぐ購入する")')
      .first();

    // 購入ボタンをクリック
    await purchaseButton.click();

    // 少し待つ
    await page.waitForTimeout(1000);

    // Stripeのチェックアウトページにリダイレクトされることを確認
    await page.waitForURL(/https:\/\/checkout.stripe.com/);

    // ---- Stripe決済フォームの入力 ----

    // Stripeフォームが完全に読み込まれるまで待機
    await page.waitForSelector('input[name="cardNumber"]', {
      state: 'visible',
    });

    // メールアドレス入力（任意のメールアドレス）
    const emailInput = page.locator('input[name="email"]');
    await emailInput.fill('aa@aa.com');

    // カード番号入力（テスト用カード番号：4242 4242 4242 4242）
    const cardNumberInput = page.locator('input[name="cardNumber"]');
    await cardNumberInput.fill('4242 4242 4242 4242');

    // 有効期限入力（任意の未来の日付）
    const expiryInput = page.locator('input[name="cardExpiry"]');
    await expiryInput.fill('12/30');

    // CVC入力（任意の3桁の数字）
    const cvcInput = page.locator('input[name="cardCvc"]');
    await cvcInput.fill('123');

    // 名前入力
    const nameInput = page.locator('input[name="billingName"]');
    await nameInput.fill('Test User');

    // 支払いボタンをクリック
    const payButton = page.locator('button[type="submit"]');
    await payButton.click();

    // ---- 決済完了後の処理 ----

    // 成功後に本の詳細ページにリダイレクトされるまで待機
    // success=true のパラメータが付与される
    await page.waitForURL(/\/books\/.*(\?success=true)?/, { timeout: 30000 });
  });

  // 購入済みコンテンツの購入ボタンをクリックした際、チェックアウトではなくコンテンツページに留まる
  test('購入済みコンテンツの購入ボタンをクリックしたら、リダイレクト', async ({
    page,
    context,
  }) => {
    // cookieに購入済みコンテンツを追加
    await context.addCookies([MOCK_PURCHASES_COOKIE]);

    await page.goto('/');

    // 有料記事の購入ボタン
    const purchaseButton = page
      .locator('div')
      .filter({
        hasText:
          /^🐈nextjsstripenextauthPremiumコンテンツ販売アプリを作るガイド￥1,200今すぐ購入する$/,
      })
      .getByRole('button');
    await expect(purchaseButton).toBeVisible();
    await purchaseButton.click();

    // 少し待つ
    await page.waitForTimeout(1000);

    // 購入済みコンテンツのページにリダイレクトされることを確認
    await expect(page).toHaveURL('/posts/nextjs-ecapp-guide');

    // h1 タグにコンテンツのタイトルが表示されていることを確認
    const articleTitle = page.locator('h1').first();
    await expect(articleTitle).toContainText(
      'コンテンツ販売アプリを作るガイド'
    );
  });
});
