import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BatchCheck - Medicine Batch Regulatory Alert Checker",
  description:
    "Mobile-first PWA to cross-reference medicine batch numbers against official CDSCO Indian drug-regulator alert lists.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "BatchCheck",
  },
  icons: {
    icon: "/icons/icon-192.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0b1120",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icons/icon-192.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen bg-navy-950 text-slate-100 flex flex-col antialiased selection:bg-sky-500 selection:text-white">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration skipped or failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

