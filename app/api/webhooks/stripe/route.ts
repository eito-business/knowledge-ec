import { NextRequest, NextResponse } from 'next/server';
import type { Stripe } from 'stripe';
import { recordCompletedPurchase } from '@/lib/supabase/utils';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new NextResponse('Stripe署名がありません', { status: 401 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET環境変数が設定されていません');
    }

    const body = await req.text();

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : '不明なエラー';
      console.error(`Webhook署名検証失敗: ${message}`);
      return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
    }

    // イベントタイプに基づく処理
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;

        // 支払いが完了した時点でSupabaseに記録する
        await recordCompletedPurchase(session);
        break;

      default:
        console.log(`未処理のイベントタイプ: ${event.type}`);
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '不明なエラー';
    console.error(`Webhook処理エラー: ${message}`);
    return new NextResponse(`Webhook Error: ${message}`, { status: 500 });
  }
}
