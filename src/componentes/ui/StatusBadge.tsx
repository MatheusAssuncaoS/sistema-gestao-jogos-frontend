import { Archive, Check, Clock3, LockKeyhole, Pause, Play, X } from 'lucide-react';

type StatusBadgeProps = {
  status: string;
  rotulo: string;
  className?: string;
};

const configuracoes = {
  ATIVO: { tom: 'dark', Icone: Check },
  ABERTA: { tom: 'success', Icone: Check },
  FINALIZADA: { tom: 'dark', Icone: Check },
  CONFIRMADA: { tom: 'success', Icone: Check },
  PRESENTE: { tom: 'success', Icone: Check },
  BLOQUEADO: { tom: 'danger', Icone: LockKeyhole },
  LOTADA: { tom: 'warning', Icone: LockKeyhole },
  INATIVO: { tom: 'neutral', Icone: Archive },
  ENCERRADA: { tom: 'neutral', Icone: Archive },
  PENDENTE: { tom: 'neutral', Icone: Clock3 },
  PREPARACAO: { tom: 'neutral', Icone: Clock3 },
  RASCUNHO: { tom: 'neutral', Icone: Clock3 },
  LISTA_ESPERA: { tom: 'warning', Icone: Clock3 },
  RECUSADO: { tom: 'danger', Icone: X },
  CANCELADA: { tom: 'danger', Icone: X },
  AUSENTE: { tom: 'danger', Icone: X },
  EM_ANDAMENTO: { tom: 'info', Icone: Play },
  PAUSADA: { tom: 'warning', Icone: Pause },
} as const;

export function StatusBadge({ status, rotulo, className = '' }: StatusBadgeProps) {
  const configuracao = configuracoes[status as keyof typeof configuracoes] ?? configuracoes.PENDENTE;
  const { Icone, tom } = configuracao;

  return <span className={`system-status system-status-${tom}${className ? ` ${className}` : ''}`} data-status={status.toLowerCase()}><Icone aria-hidden="true" /><span>{rotulo}</span></span>;
}
