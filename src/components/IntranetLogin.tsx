'use client';

import { useState } from 'react';
import { Mail, CheckCircle2 } from 'lucide-react';

interface IntranetLoginProps {
  locale: string;
  labels: {
    description: string;
    placeholder: string;
    submit: string;
    submitting: string;
    sentTitle: string;
    sentDesc: string;
  };
}

/** Same email-only sign-in pattern as MagicLinkLogin, but against the staff-only intranet endpoint. */
export default function IntranetLogin({ locale, labels }: IntranetLoginProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('sending');
    try {
      await fetch('/api/intranet/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), locale }),
      });
    } finally {
      setStatus('sent');
    }
  };

  if (status === 'sent') {
    return (
      <div className="flex flex-col items-center gap-3">
        <CheckCircle2 size={32} style={{ color: '#34d399' }} />
        <p className="text-white font-semibold">{labels.sentTitle}</p>
        <p className="text-slate-400 text-sm max-w-xs">{labels.sentDesc}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
      <p className="text-slate-400 text-center">{labels.description}</p>
      <div className="w-full relative">
        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={labels.placeholder}
          className="w-full rounded-full pl-11 pr-4 py-2.5 border text-white text-sm"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
        />
      </div>
      <button
        type="submit"
        disabled={status === 'sending'}
        className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-full transition-all disabled:opacity-50"
        style={{ background: '#F09422', color: '#1E1B18' }}
      >
        {status === 'sending' ? labels.submitting : labels.submit}
      </button>
    </form>
  );
}
