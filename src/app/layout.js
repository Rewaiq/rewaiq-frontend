import './globals.css';

export const metadata = {
  title: 'Rewaiq — Earn. Discover. Grow.',
  description: "Africa's digital earning and opportunity platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}