import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',

  // Disabled: next-intl builds these from the (spoofable) X-Forwarded-Host header. The
  // canonical/hreflang links are already emitted by generateMetadata off a fixed base URL.
  alternateLinks: false,

  localeCookie: {
    secure: process.env.NODE_ENV === 'production',
  },
});
