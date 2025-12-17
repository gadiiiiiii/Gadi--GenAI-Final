import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Riverhawk AI Quote Builder',
  description: 'Transform messy customer requests into accurate quotes in seconds',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
