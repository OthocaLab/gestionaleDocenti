import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="it">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Applicazione per la gestione delle sostituzioni dei docenti" />
        <link rel="icon" href="/img/logoiconapagina.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}