import { getTranslations } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import ScrollCue from '@/components/ScrollCue';

interface NewsItem { date: string; tag: string; title: string; excerpt: string }

const TAG_STYLES: Record<string, { color: string; bg: string }> = {
  smart_city: { color: '#F09422', bg: 'rgba(240,148,34,0.12)' },
  tecnologia: { color: '#3D8A82', bg: 'rgba(61,138,130,0.12)' },
  proyecto: { color: '#C4A882', bg: 'rgba(196,168,130,0.12)' },
  industria: { color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  innovacion: { color: '#fb923c', bg: 'rgba(251,146,60,0.12)' },
  empresa: { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
};

export default async function NoticiasPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'news' });
  const c = await getTranslations({ locale, namespace: 'common' });

  const items = t.raw('items') as NewsItem[];
  const tags = t.raw('tags') as Record<string, string>;

  return (
    <div>
      <div className="text-white py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, #28221A 0%, #1E1B18 100%)' }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'var(--accent)' }} />
        <div className="max-w-7xl mx-auto relative">
          <h1 className="text-4xl font-extrabold">{t('title')}</h1>
          <p className="mt-3 text-lg text-slate-300">{t('subtitle')}</p>
        </div>
        <ScrollCue label={c('scroll_cue')} />
      </div>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map(({ date, tag, title, excerpt }) => {
            const style = TAG_STYLES[tag] ?? { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
            return (
              <article
                key={title}
                className="rounded-2xl p-7 border flex flex-col gap-4 transition-all hover:glow-cyan-sm"
                style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ color: style.color, background: style.bg }}>{tags[tag] ?? tag}</span>
                  <time className="text-xs text-slate-500">{date}</time>
                </div>
                <h3 className="text-lg font-bold text-white leading-snug">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed flex-1">{excerpt}</p>
                <Link href="#" className="inline-flex items-center gap-1 text-sm font-medium transition-colors hover:brightness-125" style={{ color: 'var(--accent)' }}>
                  {t('read_more')} <ArrowRight size={14} />
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
