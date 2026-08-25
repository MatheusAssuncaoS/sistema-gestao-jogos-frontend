import { AlertCircle, CheckCircle2, LoaderCircle, X } from 'lucide-react';
import { useEffect } from 'react';

type AvisoTemporarioProps = {
  mensagem: string;
  aoFechar: () => void;
  duracao?: number;
  tipo?: 'sucesso' | 'erro' | 'processando';
};

export function AvisoTemporario({ mensagem, aoFechar, duracao = 4500, tipo = 'sucesso' }: AvisoTemporarioProps) {
  useEffect(() => {
    if (!mensagem.trim() || tipo === 'processando' || duracao <= 0) return;
    const temporizador = window.setTimeout(aoFechar, duracao);
    return () => window.clearTimeout(temporizador);
  }, [aoFechar, duracao, mensagem, tipo]);

  if (!mensagem.trim()) return null;

  return (
    <div className={`admin-toast admin-toast-${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'} aria-live="polite">
      {tipo === 'erro' ? <AlertCircle aria-hidden="true" /> : tipo === 'processando' ? <LoaderCircle className="admin-toast-spinner" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
      <span>{mensagem}</span>
      <button type="button" onClick={aoFechar} aria-label="Fechar aviso"><X aria-hidden="true" /></button>
    </div>
  );
}
