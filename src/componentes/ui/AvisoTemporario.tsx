import { CheckCircle2, X } from 'lucide-react';
import { useEffect } from 'react';

type AvisoTemporarioProps = {
  mensagem: string;
  aoFechar: () => void;
  duracao?: number;
};

export function AvisoTemporario({ mensagem, aoFechar, duracao = 4500 }: AvisoTemporarioProps) {
  useEffect(() => {
    if (!mensagem.trim()) return;
    const temporizador = window.setTimeout(aoFechar, duracao);
    return () => window.clearTimeout(temporizador);
  }, [aoFechar, duracao, mensagem]);

  if (!mensagem.trim()) return null;

  return (
    <div className="admin-toast admin-toast-success" role="status" aria-live="polite">
      <CheckCircle2 aria-hidden="true" />
      <span>{mensagem}</span>
      <button type="button" onClick={aoFechar} aria-label="Fechar aviso"><X aria-hidden="true" /></button>
    </div>
  );
}
