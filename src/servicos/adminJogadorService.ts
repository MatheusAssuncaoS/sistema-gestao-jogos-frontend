import { api } from './api';
import type { CadastroPendente, Categoria, SituacaoAssociativa, Usuario } from './tipos';

export interface DadosAprovacao {
  matriculaAssociado?: string;
  categoriaId: number;
  situacaoAssociativa: SituacaoAssociativa;
}

/**
 * Funções do fluxo de aprovação de cadastro (UC27). Cada tela chama estas
 * funções em vez de fetch direto, o que mantém a URL do endpoint em um
 * lugar só.
 */
export const adminJogadorService = {
  listarPendentes: () => api.get<CadastroPendente[]>('/api/admin/jogadores/pendentes'),

  listarCategorias: () => api.get<Categoria[]>('/api/admin/jogadores/categorias'),

  aprovar: (usuarioId: string, dados: DadosAprovacao) =>
    api.post(`/api/admin/jogadores/${usuarioId}/aprovar`, dados),

  recusar: (usuarioId: string) => api.post<Usuario>(`/api/admin/jogadores/${usuarioId}/recusar`),
};
