import { api } from './api';
import type { UsuarioResumo } from './tipos';

export const adminUsuarioService = {
  listar: () => api.get<UsuarioResumo[]>('/api/admin/usuarios'),

  atualizar: (usuarioId: string, dados: { nome: string; email: string; versao: number }) =>
    api.put<UsuarioResumo>(`/api/admin/usuarios/${usuarioId}`, dados),

  alterarStatus: (usuarioId: string, dados: { status: 'ATIVO' | 'BLOQUEADO' | 'INATIVO'; versao: number }) =>
    api.patch<UsuarioResumo>(`/api/admin/usuarios/${usuarioId}/status`, dados),

  excluir: (usuarioId: string, versao: number) =>
    api.delete<void>(`/api/admin/usuarios/${usuarioId}?versao=${versao}`),

  concederOrganizador: (usuarioId: string) =>
    api.post<UsuarioResumo>(`/api/admin/usuarios/${usuarioId}/organizador`),

  revogarOrganizador: (usuarioId: string) =>
    api.delete<UsuarioResumo>(`/api/admin/usuarios/${usuarioId}/organizador`),
};
