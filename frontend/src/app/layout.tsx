// src/app/layout.tsx
import type { Metadata } from 'next';
import { Source_Sans_3 } from 'next/font/google';
import './globals.css';

const sourceSans3 = Source_Sans_3({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WhatsNews',
  description: 'News aggregation and summarization platform using LLM',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={sourceSans3.className}>
        {children}
      </body>
    </html>
  );
}