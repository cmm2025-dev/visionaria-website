import { notFound } from 'next/navigation';
import PanelClient from './PanelClient';

// The executive panel reads the DPR Antofagasta parte diario; other projects don't have one yet.
export default async function ProjectPanelPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (slug !== 'dpr-antofagasta') notFound();
  return <PanelClient locale={locale} />;
}
