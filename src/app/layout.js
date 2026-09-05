import "./globals.css";
import Script from "next/script";

export const metadata = {
  title: "Portal Berita BEM ITMS",
  description: "Portal Informasi dan Berita BEM ITMS",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/logo-bem.jpg",
    apple: "/logo-bem.jpg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#172554",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="min-w-0 max-w-full overflow-x-hidden bg-gray-50 text-gray-800 antialiased">
        {children}
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}