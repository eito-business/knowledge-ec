import { NextRequest, NextResponse } from 'next/server';
import type { Stripe } from 'stripe';
import { auth } from '../../../auth';
import { checkUserPurchase } from '@/lib/supabase/utils';
import { fetchArticles, fetchBook } from '@/lib/github';
import { CURRENT_VERSION, METADATA_KEYS, stripe } from '@/lib/stripe';

// コンテンツ購入用のStripeセッションを作成
async function createCheckoutSession(
  userIdentifier: string,
  contentId: string,
  title: string,
  price: number,
  contentType: 'book' | 'article'
): Promise<Stripe.Checkout.Session> {
  const APP_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
  if (!APP_BASE_URL) {
    throw new Error('BASE_URL が設定されていません');
  }

  const successUrl =
    `${APP_BASE_URL}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`;

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    line_items: [
      {
        price_data: {
          currency: 'jpy',
          product_data: {
            name: title,
            description: `コンテンツID: ${contentId}`,
          },
          unit_amount: price,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    // webhookで使用するためのメタデータを記載
    metadata: {
      [METADATA_KEYS.USER_IDENTIFIER]: userIdentifier,
      [METADATA_KEYS.CONTENT_ID]: contentId,
      [METADATA_KEYS.PRICE]: price.toString(),
      [METADATA_KEYS.VERSION]: CURRENT_VERSION,
      [METADATA_KEYS.CONTENT_TYPE]: contentType,
    },
    success_url: successUrl,
    cancel_url: APP_BASE_URL,
  };

  return stripe.checkout.sessions.create(sessionParams);
}

type RequestData = {
  contentId: string;
  contentType: 'book' | 'article';
};

export async function POST(req: NextRequest) {
  try {
    // Auth.jsからセッション情報を取得
    const session = await auth();

    if (!session || !session.user) {
      return new NextResponse('認証が必要です', { status: 401 });
    }

    let requestData: unknown;
    try {
      requestData = await req.json();
    } catch {
      return new NextResponse('リクエスト形式が正しくありません', {
        status: 400,
      });
    }

    if (!requestData || typeof requestData !== 'object') {
      return new NextResponse('リクエスト形式が正しくありません', {
        status: 400,
      });
    }

    const { contentId, contentType } = requestData as Partial<RequestData>;

    if (
      typeof contentId !== 'string' ||
      !/^[a-z0-9-]+$/.test(contentId) ||
      (contentType !== 'book' && contentType !== 'article')
    ) {
      return new NextResponse('必要な情報が不足しています', { status: 400 });
    }

    const content =
      contentType === 'book'
        ? await fetchBook(contentId)
        : (await fetchArticles()).find((article) => article.id === contentId);

    if (!content) {
      return new NextResponse('購入対象のコンテンツが見つかりません', {
        status: 404,
      });
    }
    if (!content.isPaid || content.price <= 0) {
      return new NextResponse('このコンテンツは購入できません', {
        status: 400,
      });
    }

    // ユーザー識別子を取得 (GitHubのID)
    const userIdentifier = session.user.id
      ? String(session.user.id)
      : undefined;

    if (!userIdentifier) {
      return new NextResponse('ユーザー識別子が取得できません', {
        status: 400,
      });
    }

    // すでに購入済みの場合、リダイレクトさせる
    const existingPurchase = await checkUserPurchase(userIdentifier, contentId);
    // 既存の購入記録があれば処理をスキップ
    if (existingPurchase) {
      console.log(
        `既に購入済み: ユーザー=${userIdentifier}, コンテンツ=${contentId}`
      );
      return NextResponse.json({
        url:
          contentType === 'book'
            ? `${process.env.NEXT_PUBLIC_BASE_URL}/books/${contentId}`
            : `${process.env.NEXT_PUBLIC_BASE_URL}/posts/${contentId}`,
      });
    }

    // Stripeのセッションを作成
    const stripeSession = await createCheckoutSession(
      userIdentifier!,
      contentId,
      content.title,
      content.price,
      contentType
    );

    // チェックアウトURLを返す（クライアント側でリダイレクト）
    return NextResponse.json({
      sessionId: stripeSession.id,
      url: stripeSession.url,
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return new NextResponse('内部エラーが発生しました', { status: 500 });
  }
}
