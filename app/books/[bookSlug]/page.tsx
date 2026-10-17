import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchBooks, fetchBook } from '@/lib/github';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PurchaseButton from '@/components/purchase-button';
import { auth } from '@/auth';
import { checkUserPurchase } from '@/lib/supabase/utils';

export async function generateStaticParams() {
  const books = await fetchBooks();
  return books.map((book) => ({
    bookSlug: book.id,
  }));
}

interface BookPageProps {
  params: Promise<{ bookSlug: string }>;
  searchParams: Promise<{ success?: string }>;
}

export default async function BookPage({ params, searchParams }: BookPageProps) {
  const { bookSlug } = await params;
  const { success } = await searchParams;
  const book = await fetchBook(bookSlug);

  if (!book) {
    notFound();
  }

  const session = await auth();
  const hasPurchased =
    !!session?.user?.id &&
    book.price > 0 &&
    (await checkUserPurchase(String(session.user.id), book.id));
  const firstChapter = book.chapters?.[0];
  const canRead = book.price === 0 || hasPurchased;

  return (
    <main className='min-h-screen bg-white'>
      {/* ヒーローエリア */}
      <div className='w-full bg-slate-50 py-16 md:py-24'>
        <div className='container mx-auto px-4 max-w-5xl'>
          {success === 'true' && hasPurchased && (
            <div className='mb-8 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800'>
              購入が完了しました。下の目次から読み始められます。
            </div>
          )}

          <div className='flex flex-col md:flex-row gap-8 md:gap-12'>
            <div className='w-full md:w-1/3 max-w-[300px] mx-auto md:mx-0'>
              <div className='relative aspect-[3/4] rounded-lg overflow-hidden shadow-lg'>
                <Image
                  src={book.coverImage}
                  alt={`${book.title}の表紙`}
                  fill
                  className='object-cover'
                  sizes='(max-width: 1024px) 100vw, 300px'
                  priority
                />
              </div>
            </div>

            {/* 本の情報 */}
            <div className='w-full md:w-2/3'>
              <div className='flex flex-col gap-6'>
                <div className='flex flex-wrap gap-2'>
                  {book.tags.map((tag) => (
                    <Badge key={tag} variant='secondary'>
                      {tag}
                    </Badge>
                  ))}
                  {hasPurchased && <Badge>購入済み</Badge>}
                </div>
                <h1 className='text-4xl md:text-5xl font-bold tracking-tight'>
                  {book.title}
                </h1>
                <div className='text-gray-500'>
                  {new Date(book.updatedAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                  に更新 • 全{book.chapterCount}章
                </div>
                <p className='text-lg text-gray-700 mt-2'>{book.description}</p>
              </div>
            </div>
          </div>

          {/* 購入エリア */}
          <div className='flex flex-col mt-16 sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-white rounded-xl shadow-sm'>
            <div>
              <div className='text-lg font-semibold'>価格</div>
              <div className='text-3xl font-bold mb-2'>
                {book.price === 0
                  ? '無料'
                  : hasPurchased
                    ? '購入済み'
                    : `¥${book.price.toLocaleString()}`}
              </div>
            </div>

            {canRead && firstChapter ? (
              <Button asChild size='lg' className='w-full sm:w-auto px-12'>
                <Link href={`/books/${bookSlug}/${firstChapter.slug}`}>
                  {book.price === 0 ? '無料で読む' : '読み始める'}
                </Link>
              </Button>
            ) : book.price > 0 ? (
              <PurchaseButton
                contentId={book.id}
                contentType='book'
                price={book.price}
                title={book.title}
                size='lg'
                className='w-full sm:w-auto px-12'
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* 章一覧 */}
      <section className='container mx-auto px-4 py-16 max-w-4xl'>
        <h2 className='text-3xl font-bold mb-8'>目次</h2>
        <div className='space-y-4'>
          {book.chapters?.map((chapter, index) => (
            <Link
              key={chapter.slug}
              href={`/books/${bookSlug}/${chapter.slug}`}
              className='block'
            >
              <div className='flex items-center p-4 rounded-lg hover:bg-slate-50 transition-colors border border-gray-100'>
                <div className='w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 mr-4'>
                  <span className='font-semibold'>{index + 1}</span>
                </div>
                <div>
                  <h3 className='text-lg font-semibold'>{chapter.title}</h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* フッターエリア */}
      <div className='w-full bg-slate-50 py-16'>
        <div className='container mx-auto px-4 max-w-5xl'>
          <div className='flex flex-col items-center text-center gap-6'>
            <h2 className='text-3xl font-bold'>他の本もチェックしませんか？</h2>
            <p className='text-gray-600 max-w-2xl'>
              様々なテーマの本や記事をご用意しています。ぜひチェックしてみてください📚
            </p>
            <Link href='/#books' className='block mt-4'>
              <Button size='lg'>他の本を見る</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
