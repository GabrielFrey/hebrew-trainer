import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and configures the root HTML during static rendering.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Иврит с нуля · Hebrew from scratch</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #EAF8DE;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #102016;
  }
}`;
