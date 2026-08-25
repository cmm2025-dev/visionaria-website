import { NextRequest, NextResponse } from 'next/server';
import { decodeSession, SESSION_COOKIE } from '@/lib/session';
import {
  findContactByEmail,
  getServiceAccessToken,
  getClientInventory,
  computeTicketPriority,
  createTicket,
} from '@/lib/zoho';

export const runtime = 'nodejs';

const VALID_TIPOS = [
  'Cámaras sin señal',
  'Falla de servidor-VMS',
  'Conectividad-red',
  'Grabación-almacenamiento',
  'Consulta-capacitación',
  'Otro',
];

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  const session = cookie ? decodeSession(cookie) : null;
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const subject = String(body.subject ?? '').trim();
  const description = String(body.description ?? '').trim();
  const tipoFalla = String(body.tipoFalla ?? '');
  const ubicacion = String(body.ubicacion ?? '').trim();
  const camarasAfectadas = body.camarasAfectadas != null ? Number(body.camarasAfectadas) : null;
  const fallaGlobal = Boolean(body.fallaGlobal);
  const checklist = (body.checklist ?? {}) as Record<string, unknown>;

  if (!subject || !VALID_TIPOS.includes(tipoFalla)) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }

  try {
    const serviceToken = await getServiceAccessToken();
    const contact = await findContactByEmail(serviceToken, session.email);
    if (!contact || !contact.accountId) {
      return NextResponse.json({ error: 'no_account' }, { status: 404 });
    }

    const inventory = await getClientInventory(serviceToken, contact.accountId);
    const priority = computeTicketPriority(tipoFalla, camarasAfectadas, fallaGlobal, inventory);

    const ticket = await createTicket(serviceToken, {
      contactId: contact.id,
      subject,
      description,
      tipoFalla,
      camarasAfectadas,
      fallaGlobal,
      ubicacion,
      checklist: {
        energiaNormal: Boolean(checklist.energiaNormal),
        sinSiniestro: Boolean(checklist.sinSiniestro),
        anomaliaPersiste: Boolean(checklist.anomaliaPersiste),
        reinicioIntentado: Boolean(checklist.reinicioIntentado),
        accesoInternet: Boolean(checklist.accesoInternet),
      },
      priority,
    });

    return NextResponse.json({ ok: true, ticket, priority });
  } catch (err) {
    console.error('support/tickets create failed', err);
    return NextResponse.json({ error: 'upstream_error' }, { status: 502 });
  }
}
