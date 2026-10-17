import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import type { Stripe } from 'stripe';
import { supabaseAdmin } from './client';
import { METADATA_KEYS } from '@/lib/stripe';
import {
  hasPurchasedContent,
  setPurchasedContent,
} from '@/e2e/mocks/supabase';

interface CreatePurchaseParams {
  userIdentifier: string;
  contentId: string;
  paymentIntentId: string | null;
  amount: number;
}

// テスト環境かどうかを判定
const isTestEnv =
  process.env.APP_ENV === 'test' || process.env.NODE_ENV === 'test';

/**
 * 購入履歴を記録する
 */
export async function createPurchaseRecord({
  userIdentifier,
  contentId,
  paymentIntentId,
  amount,
}: CreatePurchaseParams) {
  // テスト環境ではモックを使用
  if (isTestEnv) {
    // モックデータを更新
    await setPurchasedContent(userIdentifier, contentId);

    // モックデータを返す
    return {
      id: 'mock-purchase-id',
      user_identifier: userIdentifier,
      content_id: contentId,
      stripe_payment_intent_id: paymentIntentId,
      amount,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabaseAdmin
    .from('purchases')
    .insert({
      user_identifier: userIdentifier,
      content_id: contentId,
      stripe_payment_intent_id: paymentIntentId,
      amount,
    })
    .select()
    .single();

  if (error) {
    console.error('購入記録エラー:', error);
    throw error;
  }

  return data;
}

/**
 * ユーザーの既存の購入記録をチェック
 */
export async function checkUserPurchase(
  userIdentifier: string,
  contentId: string
) {
  // テスト環境ではモックを使用
  if (isTestEnv) {
    return hasPurchasedContent(userIdentifier, contentId);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('purchases')
      .select('id')
      .eq('user_identifier', userIdentifier)
      .eq('content_id', contentId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `購入確認に失敗しました: ${error.message} (${error.code ?? 'unknown'})`
      );
    }

    return !!data;
  } catch (error) {
    console.error(
      '購入確認エラー:',
      error instanceof Error ? error.message : error
    );
    throw error;
  }
}

export async function recordCompletedPurchase(
  session: Stripe.Checkout.Session
) {
  if (session.payment_status !== 'paid') {
    return false;
  }

  const userIdentifier = session.metadata?.[METADATA_KEYS.USER_IDENTIFIER];
  const contentId = session.metadata?.[METADATA_KEYS.CONTENT_ID];
  const amount = session.amount_total;

  if (
    !userIdentifier ||
    !contentId ||
    amount === null ||
    !Number.isSafeInteger(amount) ||
    amount <= 0
  ) {
    throw new Error('購入セッションに有効な購入情報がありません');
  }

  const existingPurchase = await checkUserPurchase(userIdentifier, contentId);
  if (existingPurchase) {
    return true;
  }

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent?.id ?? null);

  await createPurchaseRecord({
    userIdentifier,
    contentId,
    paymentIntentId,
    amount,
  });

  return true;
}

/**
 * アクセス時に、有料コンテンツを購入していない場合はリダイレクト
 */
export async function checkAccessAndRedirect(
  contentId: string,
  contentType: 'book' | 'article'
) {
  // ログインの確認
  const session = await auth();
  if (!session?.user) redirect('/api/auth/signin');

  // 購入の確認
  const hasPurchased = await checkUserPurchase(
    String(session.user.id),
    contentId
  );
  if (!hasPurchased) {
    const redirectUrl =
      contentType === 'book'
        ? `${process.env.NEXT_PUBLIC_BASE_URL}/books/${contentId}`
        : `${process.env.NEXT_PUBLIC_BASE_URL}/#articles`;

    redirect(redirectUrl);
  }
}
