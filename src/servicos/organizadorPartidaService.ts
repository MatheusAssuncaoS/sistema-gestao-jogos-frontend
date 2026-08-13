import { api } from './api';
import type { Categoria, Inscrito, LocalPartida, Modalidade, Partida } from './tipos';

export interface DadosCriacaoPartida {
  modalidadeId: string;
  localId: string;
  categoriaId?: number;
  inicio: string;
  capacidade?: number;
  inscricoesAbremEm?: string;
  inscricoesEncerramEm?: string;
}

/**
 * Funções do fluxo de gestão de partidas pelo organizador (UC11). Cada tela
 * chama estas funções em vez de fetch direto, o que mantém a URL do
 * endpoint em um lugar só.
 */
export const organizadorPartidaService = {
  listar: () => api.get<Partida[]>('/api/organizador/partidas'),

  criar: (dados: DadosCriacaoPartida) => api.post<Partida>('/api/organizador/partidas', dados),

  abrir: (partidaId: string) => api.post<Partida>(`/api/organizador/partidas/${partidaId}/abrir`),

  cancelar: (partidaId: string) =>
    api.post<Partida>(`/api/organizador/partidas/${partidaId}/cancelar`),

  listarInscritos: (partidaId: string) =>
    api.get<Inscrito[]>(`/api/organizador/partidas/${partidaId}/inscritos`),

  listarModalidades: () => api.get<Modalidade[]>('/api/organizador/partidas/modalidades'),

  listarLocais: () => api.get<LocalPartida[]>('/api/organizador/partidas/locais'),

  listarCategorias: () => api.get<Categoria[]>('/api/organizador/partidas/categorias'),
};
