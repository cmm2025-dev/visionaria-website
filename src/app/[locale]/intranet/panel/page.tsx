import { redirect } from 'next/navigation';

// The panel moved inside its project's mini-site; keep old bookmarks working.
export default async function LegacyPanelPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/intranet/proyectos/dpr-antofagasta/panel`);
}
