import { api } from './api';
import type { UsuarioResumo } from './tipos';

export type PerfilAdministrativo = 'ADMINISTRADOR' | 'ORGANIZADOR' | 'ARBITRO';
export type DadosCriacaoUsuario = { nome: string; email: string; senha: string; papeis?: PerfilAdministrativo[]; perfilIds?: number[] };

export const adminUsuarioService = {
  vincularPerfis: (id: string, perfilIds: number[], versao: number) => api.put<UsuarioResumo>(`/api/admin/usuarios/${id}/perfis`, { perfilIds, versao }),
  criar: (dados: DadosCriacaoUsuario) => api.post<UsuarioResumo>('/api/admin/usuarios', dados),
  listar: () => api.get<UsuarioResumo[]>('/api/admin/usuarios'),

  atualizar: (usuarioId: string, dados: { nome: string; email: string; fotoUrl?: string | null; versao: number }) =>
    api.put<UsuarioResumo>(`/api/admin/usuarios/${usuarioId}`, dados),

  alterarStatus: (usuarioId: string, dados: { status: 'ATIVO' | 'BLOQUEADO' | 'INATIVO'; versao: number }) =>
    api.patch<UsuarioResumo>(`/api/admin/usuarios/${usuarioId}/status`, dados),

  excluir: (usuarioId: string, versao: number) =>
    api.delete<void>(`/api/admin/usuarios/${usuarioId}?versao=${versao}`),

  concederOrganizador: (usuarioId: string) =>
    api.post<UsuarioResumo>(`/api/admin/usuarios/${usuarioId}/organizador`),

  revogarOrganizador: (usuarioId: string) =>
    api.delete<UsuarioResumo>(`/api/admin/usuarios/${usuarioId}/organizador`),

  concederArbitro: (usuarioId: string) =>
    api.post<UsuarioResumo>(`/api/admin/usuarios/${usuarioId}/arbitro`),

  revogarArbitro: (usuarioId: string) =>
    api.delete<UsuarioResumo>(`/api/admin/usuarios/${usuarioId}/arbitro`),
};
