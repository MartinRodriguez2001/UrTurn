import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/* Manifest PWA */}
        <link rel="manifest" href="/manifest.json" />

        {/* Reset de scroll que recomienda Expo para web */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
