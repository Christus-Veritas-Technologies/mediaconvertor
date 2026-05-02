import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ConverterScreen from "@/components/converter-screen";
import type { OutputFormat } from "@MediaConvertor/conversion";

// ---------------------------------------------------------------------------
// Supported conversion pairs (input → output)
// ---------------------------------------------------------------------------
const SLUG_MAP: Record<string, { input: string; output: OutputFormat }> = {
  "mp4-to-mp3": { input: "mp4", output: "mp3" },
  "mp4-to-mp4": { input: "mp4", output: "mp4" },
  "mp3-to-mp3": { input: "mp3", output: "mp3" },
  "jpg-to-png": { input: "jpg", output: "png" },
  "jpg-to-webp": { input: "jpg", output: "webp" },
  "jpeg-to-png": { input: "jpeg", output: "png" },
  "jpeg-to-webp": { input: "jpeg", output: "webp" },
  "png-to-jpg": { input: "png", output: "jpg" },
  "png-to-webp": { input: "png", output: "webp" },
  "webp-to-png": { input: "webp", output: "png" },
  "webp-to-jpg": { input: "webp", output: "jpg" },
};

// ---------------------------------------------------------------------------
// Static generation
// ---------------------------------------------------------------------------
export function generateStaticParams(): { slug: string }[] {
  return Object.keys(SLUG_MAP).map((slug) => ({ slug }));
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pair = SLUG_MAP[slug];

  if (!pair) {
    return { title: "Not Found" };
  }

  const IN = pair.input.toUpperCase();
  const OUT = pair.output.toUpperCase();

  return {
    title: `${IN} to ${OUT} Converter — Free, Online, No Signup | MediaConvert`,
    description: `Convert ${IN} to ${OUT} online for free. No signup required. Fast and secure.`,
    openGraph: {
      title: `Free ${IN} to ${OUT} Converter`,
      description: `Upload your ${IN} file and download ${OUT} instantly — no account needed.`,
    },
  };
}

// ---------------------------------------------------------------------------
// Supporting content helpers
// ---------------------------------------------------------------------------
function SupportingContent({ input, output }: { input: string; output: string }) {
  const IN = input.toUpperCase();
  const OUT = output.toUpperCase();

  const faqs = [
    {
      q: `Is the ${IN} to ${OUT} converter free?`,
      a: `Yes. MediaConvert is completely free to use with no signup required.`,
    },
    {
      q: `How long does ${IN} to ${OUT} conversion take?`,
      a: `Most conversions complete in seconds. Larger files may take slightly longer.`,
    },
    {
      q: `Is my file kept private?`,
      a: `Your file is automatically deleted from our servers after download. We do not store your data.`,
    },
    {
      q: `What is the maximum file size?`,
      a: `You can upload files up to 500 MB.`,
    },
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: `${IN} to ${OUT} Converter`,
        applicationCategory: "MultimediaApplication",
        operatingSystem: "All",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
      {
        "@type": "HowTo",
        name: `How to convert ${IN} to ${OUT}`,
        step: [
          { "@type": "HowToStep", text: `Click the upload area and select your ${IN} file.` },
          { "@type": "HowToStep", text: `The output format is pre-set to ${OUT}.` },
          { "@type": "HowToStep", text: "Click Convert and wait a few seconds." },
          { "@type": "HowToStep", text: "Download your converted file." },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: structured data is safe static content
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mx-auto mt-16 w-full max-w-3xl space-y-12 px-4 pb-20">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">How to convert {IN} to {OUT}</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Click the upload area above and select your {IN} file.</li>
            <li>The output is already set to {OUT} — no extra steps needed.</li>
            <li>Hit <strong>Convert to {OUT}</strong> and wait a few seconds.</li>
            <li>Download the converted file directly to your device.</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Why convert {IN} to {OUT}?</h2>
          <p className="text-sm text-muted-foreground">
            {IN} and {OUT} serve different purposes. Converting lets you use your file in contexts
            where {OUT} is required — whether for compatibility, size, or quality reasons.
            MediaConvert handles the processing on our servers so you get a clean result without
            installing any software.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">FAQ</h2>
          <dl className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.q} className="space-y-1">
                <dt className="text-sm font-medium text-foreground">{faq.q}</dt>
                <dd className="text-sm text-muted-foreground">{faq.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
type ConvertSlugPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ConvertSlugPage({ params }: ConvertSlugPageProps) {
  const { slug } = await params;
  const pair = SLUG_MAP[slug];

  if (!pair) {
    notFound();
  }

  const IN = pair.input.toUpperCase();
  const OUT = pair.output.toUpperCase();

  return (
    <>
      <div className="mx-auto w-full max-w-3xl px-4 pt-10">
        <h1 className="text-3xl font-semibold text-foreground">
          Free {IN} to {OUT} Converter
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload your {IN} file and download {OUT} instantly — free, no signup.
        </p>
      </div>

      <ConverterScreen
        defaultConfig={{ inputFormat: pair.input, outputFormat: pair.output, lockedOutput: true }}
      />

      <SupportingContent input={pair.input} output={pair.output} />
    </>
  );
}

