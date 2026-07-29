import '@/styles/globals.css';
import { Outfit, JetBrains_Mono } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-code' });

export default function App({ Component, pageProps }) {
  return (
    <div className={`${outfit.variable} ${jetbrains.variable} ${outfit.className}`}>
      <Component {...pageProps} />
    </div>
  );
}
