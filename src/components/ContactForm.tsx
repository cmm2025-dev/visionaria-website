'use client';

import { useState } from 'react';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface ContactFormProps {
  labels: {
    name: string;
    email: string;
    company: string;
    message: string;
    send: string;
    success: string;
    error: string;
  };
}

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ContactForm({ labels }: ContactFormProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [fields, setFields] = useState({ name: '', email: '', company: '', message: '' });

  const set = (k: keyof typeof fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      setStatus(res.ok ? 'success' : 'error');
      if (res.ok) setFields({ name: '', email: '', company: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  const inputClass = "rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 border w-full";
  const inputStyle = { background: 'rgba(255,255,255,0.05)', borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties;

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <CheckCircle size={48} className="text-emerald-400" />
        <p className="text-lg font-semibold text-white">{labels.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {([
        { id: 'name' as const, label: labels.name, type: 'text', required: true },
        { id: 'email' as const, label: labels.email, type: 'email', required: true },
        { id: 'company' as const, label: labels.company, type: 'text', required: false },
      ]).map(({ id, label, type, required }) => (
        <div key={id} className="flex flex-col gap-1.5">
          <label htmlFor={id} className="text-sm font-medium text-slate-300">
            {label}{required && <span className="text-[#F09422] ml-0.5">*</span>}
          </label>
          <input
            id={id}
            type={type}
            required={required}
            value={fields[id]}
            onChange={set(id)}
            className={inputClass}
            style={inputStyle}
          />
        </div>
      ))}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm font-medium text-slate-300">
          {labels.message}<span className="text-[#F09422] ml-0.5">*</span>
        </label>
        <textarea
          id="message"
          rows={5}
          required
          value={fields.message}
          onChange={set('message')}
          className={`${inputClass} resize-none`}
          style={inputStyle}
        />
      </div>

      {status === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 rounded-xl px-4 py-3 border border-red-400/20">
          <AlertCircle size={16} className="shrink-0" />
          {labels.error}
        </div>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all mt-2 glow-cyan-sm hover:glow-cyan disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: 'var(--accent)', color: '#060d2e' }}
      >
        {status === 'loading'
          ? <><Loader2 size={16} className="animate-spin" /> Enviando…</>
          : <><Send size={16} /> {labels.send}</>
        }
      </button>
    </form>
  );
}
