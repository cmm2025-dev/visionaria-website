import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'Visionaria — Integramos tecnología para proteger a las personas';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const COPY = {
  es: {
    eyebrow: 'Ingeniería para ciudades seguras',
    title: 'Integramos tecnología para proteger a las personas',
    stats: [
      { value: '+3.700', label: 'cámaras en operación' },
      { value: '80+', label: 'municipios' },
      { value: '22', label: 'años en el mercado' },
    ],
  },
  en: {
    eyebrow: 'Engineering for safer cities',
    title: 'We integrate technology to protect people',
    stats: [
      { value: '+3,700', label: 'cameras in operation' },
      { value: '80+', label: 'municipalities' },
      { value: '22', label: 'years in the market' },
    ],
  },
} as const;

const fontDir = join(process.cwd(), 'src/app/[locale]/_fonts');

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = COPY[locale === 'en' ? 'en' : 'es'];

  const [regular, bold, geometric, swoosh] = await Promise.all([
    readFile(join(fontDir, 'Geist-Regular.ttf')),
    readFile(join(fontDir, 'Geist-Bold.ttf')),
    readFile(join(fontDir, 'Jost-Regular.ttf')),
    readFile(join(process.cwd(), 'public/logo-swoosh.svg'), 'utf8'),
  ]);
  const swooshSrc = `data:image/svg+xml;base64,${Buffer.from(swoosh).toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#1E1B18',
          fontFamily: 'Geist',
          padding: '64px 72px',
          position: 'relative',
        }}
      >
        {/* Accent rail — mirrors the borderLeft treatment used across the site */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: 10,
            background: '#F09422',
            display: 'flex',
          }}
        />

        {/* Warm glow, top right */}
        <div
          style={{
            position: 'absolute',
            top: -180,
            right: -140,
            width: 620,
            height: 620,
            borderRadius: 9999,
            backgroundImage:
              'radial-gradient(circle, rgba(240,148,34,0.20) 0%, rgba(240,148,34,0) 70%)',
            display: 'flex',
          }}
        />
        {/* Teal counterweight, bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: -220,
            left: -100,
            width: 520,
            height: 520,
            borderRadius: 9999,
            backgroundImage:
              'radial-gradient(circle, rgba(61,138,130,0.18) 0%, rgba(61,138,130,0) 70%)',
            display: 'flex',
          }}
        />

        {/* Wordmark: swoosh as an image, name set in a font we control so the
            letterforms don't depend on whatever the rasterizer finds locally. */}
        <div style={{ display: 'flex', position: 'relative', width: 430, height: 124 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={swooshSrc} alt="" width={372} height={124} />
          {/* Wider than the swoosh on purpose — the wordmark overhangs it on the right. */}
          <div
            style={{
              position: 'absolute',
              left: 40,
              top: 30,
              display: 'flex',
              fontFamily: 'Jost',
              fontSize: 60,
              letterSpacing: 2,
              color: '#FFFFFF',
            }}
          >
            visionaria
          </div>
        </div>

        {/* Headline block */}
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 20,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: '#F09422',
              fontWeight: 700,
              marginBottom: 22,
            }}
          >
            {t.eyebrow}
          </div>
          <div
            style={{
              display: 'block',
              textAlign: 'left',
              fontSize: 62,
              lineHeight: 1.12,
              fontWeight: 700,
              color: '#FFFFFF',
              maxWidth: 940,
            }}
          >
            {t.title}
          </div>
        </div>

        {/* Stats + tagline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', gap: 56 }}>
            {t.stats.map(({ value, label }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    display: 'flex',
                    fontSize: 44,
                    fontWeight: 700,
                    color: '#F09422',
                  }}
                >
                  {value}
                </div>
                <div style={{ display: 'flex', fontSize: 19, color: '#8A8578', marginTop: 4 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              fontSize: 17,
              letterSpacing: 4,
              color: '#3D8A82',
              fontWeight: 600,
              paddingBottom: 6,
            }}
          >
            SECURITY · VISION · INNOVATION
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Geist', data: regular, style: 'normal', weight: 400 },
        { name: 'Geist', data: bold, style: 'normal', weight: 700 },
        { name: 'Jost', data: geometric, style: 'normal', weight: 400 },
      ],
    },
  );
}
