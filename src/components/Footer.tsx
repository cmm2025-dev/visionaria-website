import Link from 'next/link';
import Image from 'next/image';

interface FooterProps {
  locale: string;
  tagline: string;
  rights: string;
  nav: Record<string, string>;
}

export default function Footer({ locale, tagline, rights, nav }: FooterProps) {
  const year = 2025;
  return (
    <footer className="mt-auto border-t" style={{ background: 'rgba(6,13,46,0.95)', borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <Image src="/logo.svg" alt="Visionaria" width={130} height={40} />
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{tagline}</p>
          </div>
          <div>
            <p className="text-white font-semibold mb-4">Links</p>
            <ul className="space-y-2 text-sm text-slate-400">
              {[
                { href: `/${locale}`, label: nav.brand },
                { href: `/${locale}/productos`, label: nav.products },
                { href: `/${locale}/casos-exito`, label: nav.cases },
                { href: `/${locale}/innovacion`, label: nav.innovation },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-[#00d4ff] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-4">Recursos</p>
            <ul className="space-y-2 text-sm text-slate-400">
              {[
                { href: `/${locale}/noticias`, label: nav.news },
                { href: `/${locale}/soporte`, label: nav.support },
                { href: `/${locale}/contacto`, label: nav.contact },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="hover:text-[#00d4ff] transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t text-sm text-center text-slate-500" style={{ borderColor: 'var(--border)' }}>
          © {year} Visionaria. {rights}
        </div>
      </div>
    </footer>
  );
}
