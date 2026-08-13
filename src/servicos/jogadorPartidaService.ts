import { api } from './api';
import type { InscricaoDoJogador, Partida } from './tipos';

export const jogadorPartidaService = {
  listarDisponiveis: () => api.get<Partida[]>('/api/partidas'),

  inscrever: (partidaId: string) =>
    api.post<InscricaoDoJogador>(`/api/partidas/${partidaId}/inscricao`),

  listarMinhasInscricoes: () =>
    api.get<InscricaoDoJogador[]>('/api/partidas/minhas-inscricoes'),

  cancelarInscricao: (partidaId: string) =>
    api.delete<void>(`/api/partidas/${partidaId}/inscricao`),
};
