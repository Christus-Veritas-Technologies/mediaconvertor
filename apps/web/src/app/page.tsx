import type { Metadata } from "next";
import Link from "next/link";

import ConverterScreen from "@/components/converter-screen";

const popularConversions = [
  { label: "MP4 to MP3", href: "/convert/mp4-to-mp3" },
  { label: "MP4 to MP4", href: "/convert/mp4-to-mp4" },
  { label: "MP3 to MP3", href: "/convert/mp3-to-mp3" },
  { label: "JPG to PNG", href: "/convert/jpg-to-png" },
  { label: "JPG to WEBP", href: "/convert/jpg-to-webp" },
  { label: "JPEG to PNG", href: "/convert/jpeg-to-png" },
  { label: "PNG to JPG", href: "/convert/png-to-jpg" },
  { label: "WEBP to PNG", href: "/convert/webp-to-png" },
] as const;

const supportedFormats = ["MP4", "MP3", "JPG", "JPEG", "PNG", "WEBP"] as const;

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "MediaConvert Free Video & Audio Converter",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "All",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "HowTo",
      name: "How to convert video and audio files online",
      step: [
        { "@type": "HowToStep", text: "Upload your file." },
        { "@type": "HowToStep", text: "Choose the output format." },
        { "@type": "HowToStep", text: "Download the converted result." },
      ],
    },
  ],
};

export const metadata: Metadata = {
  title: "Free Video Converter — Convert MP4, MP3, WAV Online | MediaConvert",
  description: "Convert video and audio files online for free. Fast, secure, and no signup required.",
  openGraph: {
    title: "Free Video & Audio Converter",
    description: "Convert video and audio files online for free. Fast, secure, and no signup required.",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
        <section className="space-y-2 pt-2">
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
            Free Video & Audio Converter
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Convert files instantly. No signup required.
          </p>
        </section>

        <ConverterScreen />

        <section className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Popular conversions</h2>
            <p className="text-sm text-muted-foreground">
              Jump into the formats people use most.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {popularConversions.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-secondary"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 pb-8 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">How it works</h2>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>1. Upload your file</li>
              <li>2. Choose format</li>
              <li>3. Download result</li>
            </ol>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">Supported formats</h2>
            <p className="mt-3 text-sm text-muted-foreground">{supportedFormats.join(", ")}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-lg font-semibold text-foreground">Why use MediaConvert</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Fast</li>
              <li>Free</li>
              <li>No signup</li>
            </ul>
          </div>
        </section>
      </main>
    </>
  );
}
