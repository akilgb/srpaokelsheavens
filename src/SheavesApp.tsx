import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// ——— Icons ———
const IconBook = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M5 3a2 2 0 0 0-2 2v13a3 3 0 0 0 3 3h13v-2H6a1 1 0 1 1 0-2h13V5a2 2 0 0 0-2-2H5zm2 3h8v2H7V6z" />
  </svg>
);
const IconSearch = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M10 4a6 6 0 1 0 3.98 10.39l4.81 4.81 1.41-1.41-4.81-4.81A6 6 0 0 0 10 4zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" />
  </svg>
);
const IconScroll = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M4 6a4 4 0 0 1 4-4h9a3 3 0 1 1 0 6H9a2 2 0 1 0 0 4h8a3 3 0 1 1 0 6H8a4 4 0 0 1-4-4V6z" />
  </svg>
);

// ——— Helpers ———
const parchment =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nNTAwJyBoZWlnaHQ9JzUwMCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48ZGVmcz48ZmlsdGVyIGlkPSdwJz48ZmVUdXJidWxlbmNlIHR5cGU9J3R1cmJ1bGVuY2UnIGJhc2VGcmVxdWVuY3k9JzAuNScgbnVtT2N0YXZlcz0nMycvPjwvZmlsdGVyPjwvZGVmcz48cmVjdCBmaWx0ZXI9InVybCgjcCkiIHdpZHRoPTEwMCVoZWlnaHQ9MTAwJSBmaWxsPSIjZWE5YzZhIi8+PC9zdmc+";

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const cls = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(' ');

const storage = {
  get<T>(k: string, f: T): T {
    try {
      const v = localStorage.getItem(k);
      return v ? (JSON.parse(v) as T) : f;
    } catch {
      return f;
    }
  },
  set(k: string, v: unknown) {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
};

// ——— Types & seed ———
type Chapter = { title?: string; content?: string };
type Novel = {
  id: string;
  title: string;
  slug?: string;
  author: string;
  tags: string[];
  rating: number;
  cover?: string;
  synopsis: string;
  chapters?: Chapter[];
  basePath?: string;
  chapterFiles?: string[];
};

const seed: Novel = {
  id: 'tg1',
  title: 'Tenacity Genius of a Cultivation World',
  slug: slugify('Tenacity Genius of a Cultivation World'),
  author: 'paokels',
  tags: ['Xianxia', 'Wuxia', 'Dark Fantasy', 'Adventure'],
  rating: 5,
  cover: 'https://piramideejecutores.com/recursos/image',
  synopsis: `Xiao is eight—the daughter of a humble teacher and a gifted seamstress, both retired martial artists. Her world is the Boundless World: a ruthless, chaotic realm where survival belongs to the strong. Immortal cultivators, privileged from birth, hoard vast cultivation arts and have nearly monopolized power, subjugating most other species.

"Father, Mother—your daughter will prevail. I will climb to the summit of the martial path you taught me. The world will remember your names... but first, I will cut down those wretched wolves."

Can a ‘fragile’, ‘small’ girl survive even her first year alone in the jungle? Follow Xiao as she faces formidable foes, uncovers ancient secrets, and awakens her true potential in a world where only the strong are allowed to keep breathing.`,
  chapters: [
    {
      title: 'Prologue: Wolf Debt',
      content:
        'In the hour between smoke and dawn, the pack came—teeth like broken moonlight...',
    },
    {
      title: 'Ch. 1: First Breath of Qi',
      content:
        'Cold dew beaded on the bark. She traced the meridians like a needle following thread...',
    },
  ],
};

// ——— App ———
export default function SheavesApp() {
  const [theme, setTheme] = useState<string>(storage.get('sheaves:theme', 'scroll'));
  const [query, setQuery] = useState('');
  const [novels, setNovels] = useState<Novel[]>(storage.get('sheaves:novels', [seed]));
  const [reader, setReader] = useState<{ open: boolean; id?: string; idx: number }>({
    open: false,
    idx: 0,
  });

  // Router sin regex (evita problemas de escape en build)
  const getRoute = () => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts[0] === 'novel' && parts[1]) {
      return { page: 'detail' as const, slug: decodeURIComponent(parts[1]) };
    }
    return { page: 'home' as const };
  };
  const [route, setRoute] = useState(getRoute());
  useEffect(() => {
    const onPop = () => setRoute(getRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const scrollBg = `linear-gradient(rgba(83,53,24,0.25), rgba(83,53,24,0.25)), url(${parchment})`;

  useEffect(() => storage.set('sheaves:theme', theme), [theme]);
  useEffect(() => storage.set('sheaves:novels', novels), [novels]);

  // Cargar índice externo si existe
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/content/index.json', { cache: 'no-store' });
        if (r.ok) {
          const data = await r.json();
          const list = (Array.isArray(data) ? data : data?.novels) || [];
          if (list.length) setNovels(list);
        }
      } catch {}
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return novels.filter((n) =>
      [n.title, n.author, n.synopsis, (n.tags || []).join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [novels, query]);

  const goDetail = (slug: string) => {
    history.pushState({}, '', `/novel/${encodeURIComponent(slug)}`);
    setRoute({ page: 'detail', slug });
  };
  const goHome = () => {
    history.pushState({}, '', '/');
    setRoute({ page: 'home' });
  };

  const Rating = ({ value }: { value: number }) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < Math.floor(value) ? 'text-amber-700' : 'text-amber-300'}>
          ★
        </span>
      ))}
      <span className="ml-1 text-xs">{value.toFixed(1)}</span>
    </div>
  );

  const readerNovel = novels.find((n) => n.id === reader.id);
  const currentIdx = Math.min(reader.idx, Math.max((readerNovel?.chapters?.length || 0) - 1, 0));
  const currentCh = readerNovel?.chapters?.[currentIdx];

  return (
    <div
      className={
        'min-h-screen ' +
        (theme === 'dark'
          ? 'bg-zinc-900 text-amber-100'
          : theme === 'light'
          ? 'bg-stone-50 text-stone-900'
          : 'text-amber-950')
      }
      style={theme === 'scroll' ? { backgroundImage: scrollBg } : undefined}
    >
      <div className="pointer-events-none fixed inset-0 border-8 border-amber-900/30 rounded-[32px] m-2" />
      <header className="max-w-7xl mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-800/90 text-amber-50 grid place-items-center">
            <IconScroll className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-amber-900">srpaokelsheaves</h1>
            <p className="text-sm text-amber-800/80">Xianxia · Wuxia · Dark Fantasy — by srpaokels</p>
          </div>
        </div>
        <button
          onClick={() => setTheme((t) => (t === 'scroll' ? 'dark' : t === 'dark' ? 'light' : 'scroll'))}
          className="px-4 py-2 rounded-xl bg-amber-100 border border-amber-300 text-amber-900"
        >
          Theme: {theme === 'scroll' ? 'Scroll' : theme === 'dark' ? 'Dark' : 'Light'}
        </button>
      </header>

      {route.page === 'home' && (
        <main className="max-w-7xl mx-auto px-4 pb-16">
          <section
            className="rounded-2xl border border-amber-300/70 bg-amber-50/70 p-6 mb-8"
            style={{ backgroundImage: theme === 'scroll' ? scrollBg : undefined }}
          >
            <div className="flex items-center gap-2 bg-white/70 border border-amber-300 rounded-xl px-3 py-2 w-full max-w-md">
              <IconSearch className="w-5 h-5 text-amber-800" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none"
                placeholder="Search titles, authors, tags..."
              />
            </div>
          </section>

          <h2 className="text-2xl font-semibold text-amber-900 flex items-center gap-2 mb-4">
            <IconBook className="w-6 h-6" />
            Library
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((n) => (
              <div key={n.id} className="rounded-2xl border border-amber-300/70 bg-amber-50/70 overflow-hidden">
                <div className="flex">
                  <div className="w-28 bg-amber-200/60 border-r border-amber-300 p-2 grid place-items-center">
                    <img src={n.cover} alt={n.title} className="h-40 w-full object-cover rounded" />
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-amber-900">{n.title}</h3>
                        <p className="text-sm text-amber-800/80">by {n.author}</p>
                      </div>
                      <Rating value={n.rating} />
                    </div>
                    <p className="mt-2 text-sm text-amber-900/90 line-clamp-2">{n.synopsis}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {n.tags.map((t) => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-amber-200 border border-amber-400">
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        className="px-3 py-1.5 rounded-xl bg-amber-700 text-amber-50"
                        onClick={() => setReader({ open: true, id: n.id, idx: 0 })}
                      >
                        Read
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300"
                        onClick={() => goDetail(n.slug || slugify(n.title))}
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {route.page === 'detail' && (
        <main className="max-w-7xl mx-auto px-4 pb-16">
          {(() => {
            const n = novels.find((x) => (x.slug || slugify(x.title)) === route.slug);
            if (!n) return <p className="py-8">Not found.</p>;
            return (
              <section className="py-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <img src={n.cover} alt={n.title} className="w-full md:w-72 rounded-2xl border border-amber-300" />
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-amber-900">{n.title}</h2>
                    <p className="text-amber-800/90 mt-1">by {n.author}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {n.tags.map((t) => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-amber-200 border border-amber-400">
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="mt-4 whitespace-pre-line text-amber-900/90">{n.synopsis}</p>
                    <div className="mt-4">
                      <button
                        className="px-3 py-1.5 rounded-xl bg-amber-700 text-amber-50"
                        onClick={() => setReader({ open: true, id: n.id, idx: 0 })}
                      >
                        Start reading
                      </button>{' '}
                      <button className="px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300" onClick={goHome}>
                        Back
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-8 rounded-2xl border border-amber-300/60 bg-amber-50/60 divide-y">
                  {(n.chapters || []).map((c, i) => (
                    <div key={i} className="p-4 flex items-center justify-between">
                      <span className="font-medium text-amber-900">{c.title || `Chapter ${i + 1}`}</span>
                      <button
                        className="px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300"
                        onClick={() => setReader({ open: true, id: n.id, idx: i })}
                      >
                        Read
                      </button>
                    </div>
                  ))}
                  {!n.chapters?.length && <div className="p-4 text-amber-800/80">No chapters yet.</div>}
                </div>
              </section>
            );
          })()}
        </main>
      )}

      <AnimatePresence>
        {reader.open && readerNovel && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setReader({ open: false, idx: 0 })} />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="relative bg-amber-50 rounded-2xl border border-amber-300 max-w-3xl w-[95%] p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-amber-800/80">{readerNovel.title}</p>
                  <h4 className="font-semibold text-amber-900">{currentCh?.title || 'Chapter'}</h4>
                </div>
                <button
                  className="px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300"
                  onClick={() => setReader({ open: false, idx: 0 })}
                >
                  Close
                </button>
              </div>

              <article
                className="prose prose-sm max-w-none text-amber-900 whitespace-pre-line"
                style={{ backgroundImage: `url(${parchment})`, padding: '1rem', borderRadius: '0.75rem' }}
              >
                {`${currentCh?.content ?? ''}\n\n(Demo) Add your full chapters here.`}
              </article>

              <div className="mt-4 flex justify-between">
                <button
                  className="px-3 py-1.5 rounded-xl bg-amber-100 border border-amber-300"
                  disabled={currentIdx === 0}
                  onClick={() => setReader({ open: true, id: readerNovel.id, idx: Math.max(0, currentIdx - 1) })}
                >
                  Previous
                </button>
                <button
                  className="px-3 py-1.5 rounded-xl bg-amber-700 text-amber-50"
                  disabled={currentIdx >= (readerNovel.chapters?.length || 1) - 1}
                  onClick={() =>
                    setReader({
                      open: true,
                      id: readerNovel.id,
                      idx: Math.min((readerNovel.chapters?.length || 1) - 1, currentIdx + 1),
                    })
                  }
                >
                  Next
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="max-w-7xl mx-auto px-4 py-10 text-sm text-amber-800/80">
        Made by <b>srpaokels</b>. Local progress saved in localStorage.
      </footer>
    </div>
  );
}
