import type { Metadata } from "next";
import { Shell } from "@/components/shell";
import { ToastProvider } from "@/components/ui";
import { session } from "@/lib/supabase";
import { siteConfig } from "@/lib/config";
import "./globals.css";
export const dynamic = "force-dynamic";
export function generateMetadata(): Metadata {
  const config = siteConfig();
  return {
    metadataBase: new URL(config.url),
    title: {
      default: "amiTea — Your campus. Your stories. Your tea.",
      template: "%s · amiTea",
    },
    description:
      "Your campus. Your stories. Your tea. A thoughtful, pseudonymous space for campus conversations.",
    openGraph: {
      title: "amiTea",
      description: "Your campus. Your stories. Your tea.",
      siteName: "amiTea",
      type: "website",
    },
  };
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await session();
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <Shell profile={profile} college={siteConfig().college}>
            {children}
          </Shell>
        </ToastProvider>
      </body>
    </html>
  );
}
