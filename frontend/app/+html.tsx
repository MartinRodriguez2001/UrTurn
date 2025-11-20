import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

const globalStyles = `
  *, *::before, *::after {
    box-sizing: border-box;
  }
  html, body, #root {
    height: 100%;
  }
  body {
    margin: 0;
    font-family: "Plus Jakarta Sans", "PlusJakartaSans-Regular", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background-color: #FFF8F1;
    color: #121417;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    min-height: 100%;
  }
  #root {
    min-height: 100%;
  }
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="theme-color" content="#F99F7C" />

        {/* Viewport necesario para que se vea como app nativa */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        />

        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
