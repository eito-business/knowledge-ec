import { NextRequest, NextResponse } from 'next/server';
import { CURRENT_VERSION, METADATA_KEYS, stripe } from '@/lib/stripe';
import { recordCompletedPurchase } from '@/lib/supabase/utils';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');
  if (!sessionId) {
    return new NextResponse('決済セッションが指定されていません', {
      status: 400,
    });
  }

  try {
    const checkoutSession =
      await stripe.checkout.sessions.retrieve(sessionId);
    const contentType =
      checkoutSession.metadata?.[METADATA_KEYS.CONTENT_TYPE];
    const contentId = checkoutSession.metadata?.[METADATA_KEYS.CONTENT_ID];
    const sessionVersion = checkoutSession.metadata?.[METADATA_KEYS.VERSION];

    if (
      checkoutSession.mode !== 'payment' ||
      sessionVersion !== CURRENT_VERSION ||
      !contentId ||
      !/^[a-z0-9-]+$/.test(contentId) ||
      (contentType !== 'book' && contentType !== 'article')
    ) {
      return new NextResponse('決済セッションの購入情報が無効です', {
        status: 400,
      });
    }

    const recorded = await recordCompletedPurchase(checkoutSession);
    if (!recorded) {
      return new NextResponse('お支払いの確認がまだ完了していません', {
        status: 409,
      });
    }

    const contentPath =
      contentType === 'book' ? `/books/${contentId}` : `/posts/${contentId}`;
    const destination = new URL(contentPath, request.url);
    destination.searchParams.set('success', 'true');
    return NextResponse.redirect(destination);
  } catch (error) {
    console.error('Checkout success confirmation failed:', error);
    return new NextResponse(
      'お支払いは完了していますが、購入の反映に失敗しました。時間をおいて再読み込みしてください。',
      { status: 500 }
    );
  }
}
