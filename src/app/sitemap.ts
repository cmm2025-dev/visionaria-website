import { MetadataRoute } from 'next';

const baseUrl = 'https://www.visionaria.cl';

const routes = [
  '',
  '/productos',
  '/productos/lpr',
  '/productos/lpr/cati',
  '/productos/cad-psim',
  '/productos/dafr',
  '/casos-exito',
  '/innovacion',
  '/noticias',
  '/clientes',
  '/soporte',
  '/contacto',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ['es', 'en'];
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of routes) {
      entries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'weekly' : 'monthly',
        priority: route === '' ? 1.0 : route.startsWith('/productos') ? 0.8 : 0.6,
        alternates: {
          languages: {
            'es-CL': `${baseUrl}/es${route}`,
            'en': `${baseUrl}/en${route}`,
          },
        },
      });
    }
  }

  return entries;
}
