'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Image from 'next/image';

const links = [
  { href: '', key: 'brand' },
  { href: '/productos', key: 'products' },
  { href: '/casos-exito', key: 'cases' },
  { href: '/innovacion', key: 'innovation' },
  { href: '/noticias', key: 'news' },
  { href: '/soporte', key: 'support' },
  { href: '/contacto', key: 'contact' },
] as const;

type NavKey = typeof links[number]['key'];

interface NavbarProps {
  locale: string;
  t: Record<NavKey, string>;
}

export default function Navbar({ locale, t }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const otherLocale = locale === 'es' ? 'en' : 'es';
  const switchPath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  return (
    <header className="sticky top-0 z-50 border-b backdrop-blur-md" style={{ background: 'rgba(6,13,46,0.85)', borderColor: 'var(--border)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Visionaria" width={140} height={44} priority />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map(({ href, key }) => {
            const fullHref = `/${locale}${href}`;
            const active = pathname === fullHref || (href === '' && pathname === `/${locale}`);
            return (
              <Link
                key={key}
                href={fullHref}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'text-[#F09422] bg-[rgba(240,148,34,0.1)]'
                    : 'text-slate-300 hover:text-[#F09422] hover:bg-[rgba(240,148,34,0.08)]'
                }`}
              >
                {t[key]}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={switchPath}
            className="text-sm font-medium text-slate-300 hover:text-[#F09422] rounded-md px-3 py-1.5 transition-colors border"
            style={{ borderColor: 'var(--border)' }}
          >
            {otherLocale.toUpperCase()}
          </Link>
          <button
            className="lg:hidden p-2 rounded-md text-slate-300 hover:text-[#F09422]"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t px-4 pb-4" style={{ borderColor: 'var(--border)', background: 'rgba(6,13,46,0.97)' }}>
          {links.map(({ href, key }) => (
            <Link
              key={key}
              href={`/${locale}${href}`}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-sm font-medium text-slate-300 hover:text-[#F09422]"
            >
              {t[key]}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
