import ConverterScreen from "@/components/converter-screen";

type ConvertSlugPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ConvertSlugPage({ params }: ConvertSlugPageProps) {
  const { slug } = await params;
  return <ConverterScreen presetId={slug} />;
}
