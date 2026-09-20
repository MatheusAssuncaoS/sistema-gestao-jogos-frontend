import { api } from './api';
import type { Categoria, LocalPartida, Modalidade } from './tipos';

export const adminConfiguracaoService = {
  listarModalidades: () => api.get<Modalidade[]>('/api/admin/configuracoes/modalidades'),
  criarModalidade: (nome: string, ativo = true) => api.post<Modalidade>('/api/admin/configuracoes/modalidades', { nome, ativo }),
  editarModalidade: (modalidadeId: string, nome: string, ativo = true) => api.put<Modalidade>(`/api/admin/configuracoes/modalidades/${modalidadeId}`, { nome, ativo }),
  excluirModalidade: (modalidadeId: string) => api.delete<void>(`/api/admin/configuracoes/modalidades/${modalidadeId}`),
  listarLocais: () => api.get<LocalPartida[]>('/api/admin/configuracoes/locais'),
  criarLocal: (nome: string, descricao: string | undefined, modalidadeIds: string[], ativo = true) => api.post<LocalPartida>('/api/admin/configuracoes/locais', { nome, descricao, modalidadeIds, ativo }),
  editarLocal: (localId: string, nome: string, descricao: string | undefined, modalidadeIds: string[], ativo = true) => api.put<LocalPartida>(`/api/admin/configuracoes/locais/${localId}`, { nome, descricao, modalidadeIds, ativo }),
  excluirLocal: (localId: string) => api.delete<void>(`/api/admin/configuracoes/locais/${localId}`),
  listarCategorias: () => api.get<Categoria[]>('/api/admin/configuracoes/categorias'),
  criarCategoria: (nome: string, peso: number) => api.post<Categoria>('/api/admin/configuracoes/categorias', { nome, peso }),
  editarCategoria: (categoriaId: number, nome: string, peso: number) => api.put<Categoria>(`/api/admin/configuracoes/categorias/${categoriaId}`, { nome, peso }),
  excluirCategoria: (categoriaId: number) => api.delete<void>(`/api/admin/configuracoes/categorias/${categoriaId}`),
};
