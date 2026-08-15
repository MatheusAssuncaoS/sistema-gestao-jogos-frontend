import { api } from './api';
import type { Categoria, LocalPartida, Modalidade } from './tipos';

export const adminConfiguracaoService = {
  listarModalidades: () => api.get<Modalidade[]>('/api/admin/configuracoes/modalidades'),
  criarModalidade: (nome: string) => api.post<Modalidade>('/api/admin/configuracoes/modalidades', { nome }),
  editarModalidade: (modalidadeId: string, nome: string) => api.put<Modalidade>(`/api/admin/configuracoes/modalidades/${modalidadeId}`, { nome }),
  excluirModalidade: (modalidadeId: string) => api.delete<void>(`/api/admin/configuracoes/modalidades/${modalidadeId}`),
  listarLocais: () => api.get<LocalPartida[]>('/api/admin/configuracoes/locais'),
  criarLocal: (nome: string, descricao?: string) => api.post<LocalPartida>('/api/admin/configuracoes/locais', { nome, descricao }),
  editarLocal: (localId: string, nome: string, descricao?: string) => api.put<LocalPartida>(`/api/admin/configuracoes/locais/${localId}`, { nome, descricao }),
  excluirLocal: (localId: string) => api.delete<void>(`/api/admin/configuracoes/locais/${localId}`),
  listarCategorias: () => api.get<Categoria[]>('/api/admin/configuracoes/categorias'),
  criarCategoria: (nome: string, peso: number) => api.post<Categoria>('/api/admin/configuracoes/categorias', { nome, peso }),
  editarCategoria: (categoriaId: number, nome: string, peso: number) => api.put<Categoria>(`/api/admin/configuracoes/categorias/${categoriaId}`, { nome, peso }),
  excluirCategoria: (categoriaId: number) => api.delete<void>(`/api/admin/configuracoes/categorias/${categoriaId}`),
};
