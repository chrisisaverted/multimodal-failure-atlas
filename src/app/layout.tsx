import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://chrisisaverted.github.io/multimodal-failure-atlas/"),
  title: { default: "The Multimodal Failure Atlas", template: "%s · Failure Atlas" },
  description:
    "A living, executable field guide to image and video failure modes in frontier multimodal models.",
  openGraph: {
    title: "The Multimodal Failure Atlas",
    description: "Fresh evidence. Controlled generators. No cherry-picked gotchas.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
