/**
 * Channel-agnostic conversation logic for the WhatsApp support bot: a quick-answer menu plus a
 * progressive fault-report questionnaire (same structure as the web ticket form). Pure and
 * transport-free on purpose — it only takes the conversation's current state and the user's
 * latest message, and returns the reply text plus the next state. The webhook layer is
 * responsible for persisting `WhatsAppConversationState` between messages and for actually
 * creating the ticket once this returns a 'create_ticket' action.
 */

export const TIPOS_FALLA = [
  'Camaras sin Señal',
  'Falla de Servidores -VMS',
  'Falla de Sistema de Grabacion',
  'Falla en Estacion de Operador',
  'Falla de Monitor VideoWall',
] as const;

const FAQ_ENTRIES: { question: string; answer: string }[] = [
  {
    question: 'Horario de atención',
    answer: 'Nuestro centro de operaciones monitorea 24/7. La mesa de ayuda por este canal atiende de lunes a domingo.',
  },
  {
    question: '¿Cómo reinicio el equipo/servidor?',
    answer: 'Desconecta la alimentación eléctrica del equipo por 10 segundos y vuelve a conectarla. Espera 2-3 minutos a que reinicie por completo antes de verificar si el problema persiste.',
  },
  {
    question: '¿Qué significan las luces del grabador?',
    answer: 'Luz verde fija: operando con normalidad. Luz roja o intermitente: posible falla de disco o grabación — repórtalo como falla si persiste.',
  },
  {
    question: '¿Cómo verifico si tengo acceso a internet en el sitio?',
    answer: 'Intenta cargar cualquier página web desde un computador conectado a la misma red del sistema. Si no carga, contacta a tu proveedor de internet antes de reportar la falla.',
  },
];

export interface Checklist {
  energiaNormal: boolean;
  sinSiniestro: boolean;
  anomaliaPersiste: boolean;
  reinicioIntentado: boolean;
  accesoInternet: boolean;
}

const CHECKLIST_QUESTIONS: { key: keyof Checklist; question: string }[] = [
  { key: 'energiaNormal', question: '¿La energía eléctrica del sitio está normal?' },
  { key: 'sinSiniestro', question: '¿Verificaste que no hay un siniestro o accidente evidente (incendio, choque, inundación, etc.)?' },
  { key: 'anomaliaPersiste', question: '¿La anomalía persiste hace más de 1 hora?' },
  { key: 'reinicioIntentado', question: '¿Ya intentaste reiniciar el equipo/servidor?' },
  { key: 'accesoInternet', question: '¿Hay acceso a internet en el sitio?' },
];

type Step =
  | 'menu'
  | 'faq_answer'
  | 'tipoFalla'
  | 'camaras'
  | `checklist_${number}`
  | 'ubicacion'
  | 'confirm';

export interface WhatsAppConversationState {
  step: Step;
  tipoFalla?: string;
  camarasAfectadas?: number;
  fallaGlobal?: boolean;
  checklist: Partial<Checklist>;
  ubicacion?: string;
}

export interface FlowResult {
  reply: string;
  /** null means the conversation is finished (menu closed, ticket created, or cancelled) and no state should be kept. */
  state: WhatsAppConversationState | null;
  action?: 'create_ticket';
  ticketInput?: {
    tipoFalla: string;
    camarasAfectadas: number | null;
    fallaGlobal: boolean;
    ubicacion: string;
    checklist: Checklist;
  };
}

function menuText(): string {
  const lines = ['Elige una opción escribiendo el número:', '', '1. Preguntas frecuentes', '2. Reportar una falla', '3. Hablar con un agente'];
  return lines.join('\n');
}

function faqMenuText(): string {
  const lines = FAQ_ENTRIES.map((f, i) => `${i + 1}. ${f.question}`);
  return ['¿Sobre qué tienes dudas?', '', ...lines, '', '0. Volver al menú principal'].join('\n');
}

function tipoFallaText(): string {
  const lines = TIPOS_FALLA.map((t, i) => `${i + 1}. ${t}`);
  return ['¿Qué tipo de falla estás reportando?', '', ...lines].join('\n');
}

const START_STATE: WhatsAppConversationState = { step: 'menu', checklist: {} };

/** Entry point for a brand-new conversation (no prior state stored for this contact). */
export function startConversation(): FlowResult {
  return { reply: menuText(), state: START_STATE };
}

/** Advances the conversation given the previous state and the user's latest inbound message. */
export function handleMessage(state: WhatsAppConversationState, message: string): FlowResult {
  const text = message.trim();

  if (state.step === 'menu') {
    if (text === '1') return { reply: faqMenuText(), state: { ...state, step: 'faq_answer' } };
    if (text === '2') return { reply: tipoFallaText(), state: { step: 'tipoFalla', checklist: {} } };
    if (text === '3') return { reply: 'Te conectamos con un agente. Cuéntanos brevemente en qué te podemos ayudar mientras tanto.', state: null };
    return { reply: `No entendí tu respuesta.\n\n${menuText()}`, state };
  }

  if (state.step === 'faq_answer') {
    if (text === '0') return { reply: menuText(), state: { step: 'menu', checklist: {} } };
    const idx = Number(text) - 1;
    const entry = FAQ_ENTRIES[idx];
    if (!entry) return { reply: `No entendí tu respuesta.\n\n${faqMenuText()}`, state };
    return { reply: `${entry.answer}\n\n${menuText()}`, state: { step: 'menu', checklist: {} } };
  }

  if (state.step === 'tipoFalla') {
    const idx = Number(text) - 1;
    const tipo = TIPOS_FALLA[idx];
    if (!tipo) return { reply: `No entendí tu respuesta.\n\n${tipoFallaText()}`, state };
    const next: WhatsAppConversationState = { ...state, tipoFalla: tipo, fallaGlobal: false };
    if (tipo === 'Camaras sin Señal') {
      return { reply: '¿Cuántas cámaras están afectadas? (responde solo con el número)', state: { ...next, step: 'camaras' } };
    }
    return { reply: CHECKLIST_QUESTIONS[0].question + ' (responde Sí o No)', state: { ...next, step: 'checklist_0' } };
  }

  if (state.step === 'camaras') {
    const n = Number(text);
    if (!Number.isFinite(n) || n < 0) return { reply: 'Por favor responde solo con un número (ej: 3).', state };
    return {
      reply: CHECKLIST_QUESTIONS[0].question + ' (responde Sí o No)',
      state: { ...state, camarasAfectadas: n, step: 'checklist_0' },
    };
  }

  if (state.step.startsWith('checklist_')) {
    const i = Number(state.step.replace('checklist_', ''));
    const yes = /^s(í|i)?$/i.test(text);
    const no = /^no$/i.test(text);
    if (!yes && !no) return { reply: `Por favor responde Sí o No.\n\n${CHECKLIST_QUESTIONS[i].question}`, state };

    const checklist = { ...state.checklist, [CHECKLIST_QUESTIONS[i].key]: yes };
    const nextIdx = i + 1;
    if (nextIdx < CHECKLIST_QUESTIONS.length) {
      return { reply: CHECKLIST_QUESTIONS[nextIdx].question + ' (responde Sí o No)', state: { ...state, checklist, step: `checklist_${nextIdx}` } };
    }
    return { reply: '¿Cuál es la ubicación o cámara específica afectada? (escribe "no aplica" si no corresponde)', state: { ...state, checklist, step: 'ubicacion' } };
  }

  if (state.step === 'ubicacion') {
    const ubicacion = text;
    const summary = [
      'Resumen de tu reporte:',
      `- Tipo de falla: ${state.tipoFalla}`,
      state.camarasAfectadas != null ? `- Cámaras afectadas: ${state.camarasAfectadas}` : null,
      `- Ubicación: ${ubicacion}`,
      '',
      '¿Confirmas el envío? (1: Sí, 2: Cancelar)',
    ].filter(Boolean).join('\n');
    return { reply: summary, state: { ...state, ubicacion, step: 'confirm' } };
  }

  if (state.step === 'confirm') {
    if (text === '2') return { reply: `Reporte cancelado, no se generó ningún ticket.\n\n${menuText()}`, state: { step: 'menu', checklist: {} } };
    if (text !== '1') return { reply: 'Responde 1 para confirmar o 2 para cancelar.', state };

    const checklist: Checklist = {
      energiaNormal: !!state.checklist.energiaNormal,
      sinSiniestro: !!state.checklist.sinSiniestro,
      anomaliaPersiste: !!state.checklist.anomaliaPersiste,
      reinicioIntentado: !!state.checklist.reinicioIntentado,
      accesoInternet: !!state.checklist.accesoInternet,
    };
    return {
      reply: 'Gracias, tu ticket fue generado. Te avisaremos por este medio ante cualquier novedad.',
      state: null,
      action: 'create_ticket',
      ticketInput: {
        tipoFalla: state.tipoFalla!,
        camarasAfectadas: state.camarasAfectadas ?? null,
        fallaGlobal: !!state.fallaGlobal,
        ubicacion: state.ubicacion ?? '',
        checklist,
      },
    };
  }

  return { reply: menuText(), state: { step: 'menu', checklist: {} } };
}
