'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

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
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <span className="text-xl font-bold text-indigo-700 tracking-tight">Visionaria</span>
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
                    ? 'text-indigo-700 bg-indigo-50'
                    : 'text-gray-600 hover:text-indigo-700 hover:bg-indigo-50'
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
            className="text-sm font-medium text-gray-500 hover:text-indigo-700 border border-gray-200 rounded-md px-3 py-1.5 transition-colors"
          >
            {otherLocale.toUpperCase()}
          </Link>
          <button
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-indigo-700"
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 pb-4">
          {links.map(({ href, key }) => (
            <Link
              key={key}
              href={`/${locale}${href}`}
              onClick={() => setOpen(false)}
              className="block py-2.5 text-sm font-medium text-gray-700 hover:text-indigo-700"
            >
              {t[key]}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
