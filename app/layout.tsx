import './globals.css';
import Navbar from './components/Navbar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-grow">{children}</main>
      </body>
    </html>
  );
}