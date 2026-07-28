import Head from 'next/head';
import sites from '../../monitor-sites.json';
import styles from '@/styles/Home.module.css';

export default function Home() {
  const tz = process.env.NEXT_PUBLIC_MONITOR_TIMEZONE || 'Asia/Dhaka';

  return (
    <>
      <Head>
        <title>Site Monitor</title>
        <meta name="description" content="Scheduled uptime checks with email alerts" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.title}>Site Monitor</h1>
        <p className={styles.lead}>
          Checks all sites twice daily ({tz}: <strong>10:00</strong> and <strong>18:00</strong>)
          and emails OK or alert summaries via Resend.
        </p>
        <section className={styles.panel}>
          <h2>Monitored sites ({sites.length})</h2>
          <ul className={styles.siteList}>
            {sites.map((s) => (
              <li key={s.url}>
                <strong>{s.name}</strong>
                <br />
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.url}
                </a>
              </li>
            ))}
          </ul>
          <p className={styles.hint}>
            Edit <code>monitor-sites.json</code> or set <code>MONITOR_SITES</code> on Vercel, then
            redeploy.
          </p>
        </section>
      </main>
    </>
  );
}
