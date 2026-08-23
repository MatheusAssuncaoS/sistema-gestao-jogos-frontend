import { api } from './api';
import type { InscricaoDoJogador, Inscrito, Partida } from './tipos';

export const jogadorPartidaService = {
  listarDisponiveis: () => api.get<Partida[]>('/api/partidas'),

  inscrever: (partidaId: string) =>
    api.post<InscricaoDoJogador>(`/api/partidas/${partidaId}/inscricao`),

  listarMinhasInscricoes: () =>
    api.get<InscricaoDoJogador[]>('/api/partidas/minhas-inscricoes'),

  listarParticipantes: (partidaId: string) =>
    api.get<Inscrito[]>(`/api/partidas/${partidaId}/participantes`),

  cancelarInscricao: (partidaId: string) =>
    api.delete<void>(`/api/partidas/${partidaId}/inscricao`),
};
