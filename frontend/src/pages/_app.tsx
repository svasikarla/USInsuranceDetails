import '../../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AuthProvider } from '../contexts/AuthContext';
import { SimpleDataProvider } from '../contexts/DataContextSimple';
import { UIProvider } from '../contexts/UIContext';
import { AccessibilityChecker } from '../components/accessibility/AccessibilityChecker';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🛡️</text></svg>" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <AuthProvider>
        <UIProvider>
          <SimpleDataProvider>
            <Component {...pageProps} />
            <AccessibilityChecker />
          </SimpleDataProvider>
        </UIProvider>
      </AuthProvider>
    </>
  );
}
