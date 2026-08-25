import { api } from './api';
import type { Inscrito, Partida } from './tipos';

export type TimeArbitragem = 'AMARELO' | 'AZUL';
export type StatusArbitragem = 'PREPARACAO' | 'EM_ANDAMENTO' | 'PAUSADA' | 'FINALIZADA';

export interface GolArbitragemApi {
  id: string;
  time: TimeArbitragem;
  jogadorId: string;
  segundo: number;
}

export interface PunicaoArbitragemApi extends GolArbitragemApi {
  tipo: 'AMARELO' | 'VERMELHO';
  motivo: string;
}

export interface EstadoArbitragem {
  partidaId: string;
  status: StatusArbitragem;
  segundos: number;
  dados: {
    acrescimos: number;
    escala: Record<string, TimeArbitragem>;
    gols: GolArbitragemApi[];
    punicoes: PunicaoArbitragemApi[];
  };
  versao: number;
  atualizadoEm: string | null;
}

export type AtualizarEstadoArbitragem = Pick<EstadoArbitragem, 'status' | 'segundos' | 'dados' | 'versao'>;

export const arbitroService = {
  listarPartidas: () => api.get<Partida[]>('/api/arbitro/partidas'),
  listarParticipantes: (partidaId: string) => api.get<Inscrito[]>(`/api/arbitro/partidas/${partidaId}/participantes`),
  obterEstado: (partidaId: string) => api.get<EstadoArbitragem>(`/api/arbitro/partidas/${partidaId}/estado`),
  salvarEstado: (partidaId: string, estado: AtualizarEstadoArbitragem) => api.put<EstadoArbitragem>(`/api/arbitro/partidas/${partidaId}/estado`, estado),
};
