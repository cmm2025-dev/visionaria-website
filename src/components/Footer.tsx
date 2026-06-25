import Link from 'next/link';

interface FooterProps {
  locale: string;
  tagline: string;
  rights: string;
  nav: Record<string, string>;
}

export default function Footer({ locale, tagline, rights, nav }: FooterProps) {
  const year = 2025;
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <span className="text-white text-xl font-bold tracking-tight">Visionaria</span>
            <p className="mt-3 text-sm leading-relaxed">{tagline}</p>
          </div>
          <div>
            <p className="text-white font-semibold mb-4">Links</p>
            <ul className="space-y-2 text-sm">
              {[
                { href: `/${locale}`, label: nav.brand },
                { href: `/${locale}/productos`, label: nav.products },
                { href: `/${locale}/casos-exito`, label: nav.cases },
                { href: `/${locale}/innovacion`, label: nav.innovation },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-4">Recursos</p>
            <ul className="space-y-2 text-sm">
              {[
                { href: `/${locale}/noticias`, label: nav.news },
                { href: `/${locale}/soporte`, label: nav.support },
                { href: `/${locale}/contacto`, label: nav.contact },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-gray-800 text-sm text-center">
          © {year} Visionaria. {rights}
        </div>
      </div>
    </footer>
  );
}
