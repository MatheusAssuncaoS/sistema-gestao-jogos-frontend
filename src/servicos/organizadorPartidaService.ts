import { api } from './api';
import type { Categoria, Inscrito, LocalPartida, Modalidade, Partida } from './tipos';

export interface DadosCriacaoPartida {
  modalidadeId: string;
  localId: string;
  categoriaId?: number;
  inicio: string;
  duracaoMinutos?: number;
  capacidade?: number;
  inscricoesAbremEm?: string;
  inscricoesEncerramEm?: string;
  corEquipeAzul?: string;
  corEquipeAmarela?: string;
  nomeEquipeAzul?: string;
  nomeEquipeAmarela?: string;
}
export interface DadosCriacaoPartidasLote extends Omit<DadosCriacaoPartida, 'inicio'> { inicios: string[]; }

export interface DadosEdicaoPartida {
  localId: string;
  categoriaId?: number;
  inicio: string;
  duracaoMinutos?: number;
  inscricoesAbremEm?: string;
  inscricoesEncerramEm?: string;
  corEquipeAzul?: string;
  corEquipeAmarela?: string;
  nomeEquipeAzul?: string;
  nomeEquipeAmarela?: string;
  versao: number;
}

/**
 * Funções do fluxo de gestão de partidas pelo organizador (UC11). Cada tela
 * chama estas funções em vez de fetch direto, o que mantém a URL do
 * endpoint em um lugar só.
 */
export const organizadorPartidaService = {
  listar: () => api.get<Partida[]>('/api/organizador/partidas'),

  criar: (dados: DadosCriacaoPartida) => api.post<Partida>('/api/organizador/partidas', dados),
  criarLote: (dados: DadosCriacaoPartidasLote) => api.post<Partida[]>('/api/organizador/partidas/lote', dados),

  editar: (partidaId: string, dados: DadosEdicaoPartida) =>
    api.put<Partida>(`/api/organizador/partidas/${partidaId}`, dados),

  abrir: (partidaId: string) => api.post<Partida>(`/api/organizador/partidas/${partidaId}/abrir`),

  cancelar: (partidaId: string) =>
    api.post<Partida>(`/api/organizador/partidas/${partidaId}/cancelar`),

  excluir: (partidaId: string) =>
    api.post<Partida>(`/api/organizador/partidas/${partidaId}/excluir`),

  listarInscritos: (partidaId: string) =>
    api.get<Inscrito[]>(`/api/organizador/partidas/${partidaId}/inscritos`),

  listarModalidades: () => api.get<Modalidade[]>('/api/organizador/partidas/modalidades'),

  listarLocais: () => api.get<LocalPartida[]>('/api/organizador/partidas/locais'),

  listarCategorias: () => api.get<Categoria[]>('/api/organizador/partidas/categorias'),
};
