import Head from 'next/head';
import Image from 'next/image';
import fs from 'fs';
import path from 'path';
import styles from '@/styles/Home.module.css';

function HealthRing({ percent }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const offset = c - (percent / 100) * c;

  return (
    <svg className={styles.ringSvg} viewBox="0 0 88 88" aria-hidden>
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFB800" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>
      </defs>
      <circle className={styles.ringBg} cx="44" cy="44" r={r} />
      <circle
        className={styles.ringFg}
        cx="44"
        cy="44"
        r={r}
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

export default function Home({ lastStatus }) {
  const tz = lastStatus?.timezone || 'Asia/Dhaka';
  const results = lastStatus?.results || [];
  const hasCheck = lastStatus?.checkedAtLabel && results.length > 0;
  const okCount = results.filter((r) => r.ok).length;
  const healthPct = results.length ? Math.round((okCount / results.length) * 100) : 0;
  const maxMs = hasCheck ? Math.max(...results.map((r) => r.ms), 1) : 1;

  return (
    <>
      <Head>
        <title>Site Monitor · Ether Tech</title>
        <meta name="description" content="Scheduled uptime checks with email alerts" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={styles.page}>
        <div className={styles.gridBg} aria-hidden />
        <div className={styles.wrap}>
          <div className={styles.topBar}>
            <a
              href="https://www.ethertech.ltd/"
              className={styles.brand}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/ethertech-logo.png"
                alt="Ether Tech"
                width={160}
                height={99}
                className={styles.logoImg}
                priority
              />
            </a>
            <div className={styles.livePill}>
              <span className={styles.liveDot} aria-hidden />
              {hasCheck ? (lastStatus.allOk ? 'All systems go' : 'Attention needed') : 'Awaiting sync'}
            </div>
          </div>

          <div className={styles.bento}>
            <div className={styles.hero}>
              <div className={styles.heroInner}>
                <h1 className={styles.heroTitle}>
                  Site <span className={styles.heroTitleAccent}>Monitor</span>
                </h1>
                <p className={styles.heroDesc}>
                  Eight properties. Twice-daily scans. Email the moment something breaks.
                </p>
              </div>
            </div>

            {hasCheck ? (
              <>
                <div className={styles.tile}>
                  <span className={styles.tileLabel}>Fleet health</span>
                  <div className={styles.ringWrap}>
                    <HealthRing percent={healthPct} />
                    <div>
                      <div className={styles.ringPct}>{healthPct}%</div>
                      <div className={styles.ringCaption}>
                        {okCount}/{results.length} online
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.tile}>
                  <span className={styles.tileLabel}>Last pulse</span>
                  <div className={styles.timeBlock}>
                    {tz}
                    <time dateTime={lastStatus.checkedAt}>{lastStatus.checkedAtLabel}</time>
                  </div>
                </div>

                <div className={styles.tile} style={{ gridColumn: '1 / -1' }}>
                  <span className={styles.tileLabel}>Schedule · GitHub Actions</span>
                  <div className={styles.scheduleStack}>
                    <div className={styles.slot}>
                      <span>Morning run</span>
                      <span className={styles.slotTime}>10:00</span>
                    </div>
                    <div className={styles.slot}>
                      <span>Evening run</span>
                      <span className={styles.slotTime}>18:00</span>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <section className={styles.panel}>
            <div className={styles.panelTop}>
              <h2 className={styles.panelTitle}>Endpoints</h2>
              {hasCheck && (
                <span className={styles.countBadge}>{results.length} tracked</span>
              )}
            </div>

            {hasCheck ? (
              <ul className={styles.siteGrid}>
                {results.map((r) => {
                  const warn = r.protected || (r.ok && r.error);
                  const cardClass = !r.ok
                    ? styles.siteCardBad
                    : warn
                      ? styles.siteCardWarn
                      : styles.siteCardOk;
                  const tagClass = !r.ok
                    ? styles.tagBad
                    : warn
                      ? styles.tagWarn
                      : styles.tagOk;
                  return (
                  <li key={r.url} className={`${styles.siteCard} ${cardClass}`}>
                    <div className={styles.siteHead}>
                      <span className={styles.siteName}>{r.name}</span>
                      <span className={`${styles.statusTag} ${tagClass}`}>
                        {r.status ?? 'ERR'}
                      </span>
                    </div>
                    <span className={styles.siteLink}>
                      <a href={r.url} target="_blank" rel="noopener noreferrer">
                        {r.url.replace(/^https?:\/\//, '')}
                      </a>
                    </span>
                    <div className={styles.latencyTrack}>
                      <div
                        className={`${styles.latencyFill} ${!r.ok ? styles.latencyFillBad : warn ? styles.latencyFillWarn : ''}`}
                        style={{ width: `${Math.min(100, (r.ms / maxMs) * 100)}%` }}
                      />
                    </div>
                    <p className={styles.latencyMeta}>
                      {r.ms}ms
                      {r.error ? ` · ${r.error}` : ''}
                    </p>
                  </li>
                  );
                })}
              </ul>
            ) : (
              <div className={styles.empty}>
                <div className={styles.emptyOrb} aria-hidden>
                  ◷
                </div>
                <p className={styles.hint}>
                  {lastStatus?.message || 'First scheduled check will populate this board.'}
                </p>
              </div>
            )}
          </section>

          <p className={styles.footer}>Ether Tech · {tz}</p>
        </div>
      </div>
    </>
  );
}

export async function getStaticProps() {
  let lastStatus = null;
  try {
    const filePath = path.join(process.cwd(), 'public/last-status.json');
    lastStatus = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    lastStatus = { message: 'Could not load last status.', results: [] };
  }

  return {
    props: { lastStatus },
    revalidate: 120,
  };
}
