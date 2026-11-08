import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { error } = await supabaseAdmin
      .from('purchases')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Supabase keep-alive query failed:', error);
      return NextResponse.json(
        { error: 'Supabase keep-alive failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Supabase keep-alive request failed:', error);
    return NextResponse.json(
      { error: 'Supabase keep-alive failed' },
      { status: 500 }
    );
  }
}
