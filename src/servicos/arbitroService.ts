import { api } from './api';
import type { Inscrito, Partida } from './tipos';

export const arbitroService = {
  listarPartidas: () => api.get<Partida[]>('/api/arbitro/partidas'),
  listarParticipantes: (partidaId: string) => api.get<Inscrito[]>(`/api/arbitro/partidas/${partidaId}/participantes`),
};
