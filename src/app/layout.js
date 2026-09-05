import "./globals.css";

export const metadata = {
  title: "Portal Berita BEM ITMS",
  description: "Portal Informasi dan Berita BEM ITMS",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-w-0 max-w-full overflow-x-hidden bg-gray-50 text-gray-800 antialiased">
        {children}
      </body>
    </html>
  );
}