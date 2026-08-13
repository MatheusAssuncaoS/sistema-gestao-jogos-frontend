import { api } from './api';
import type { UsuarioResumo } from './tipos';

export const adminUsuarioService = {
  listar: () => api.get<UsuarioResumo[]>('/api/admin/usuarios'),

  concederOrganizador: (usuarioId: string) =>
    api.post<UsuarioResumo>(`/api/admin/usuarios/${usuarioId}/organizador`),

  revogarOrganizador: (usuarioId: string) =>
    api.delete<UsuarioResumo>(`/api/admin/usuarios/${usuarioId}/organizador`),
};
