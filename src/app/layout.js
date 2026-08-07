import "./globals.css";

export const metadata = {
  title: "Portal Berita BEM ITMS",
  description: "Portal Informasi dan Berita BEM ITMS",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-800 antialiased">
        {children}
      </body>
    </html>
  );
}