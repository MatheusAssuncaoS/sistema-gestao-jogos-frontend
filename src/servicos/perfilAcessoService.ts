import { api } from './api';

export interface PermissaoAcesso {
  codigo: string;
  grupo: string;
  nome: string;
  descricao: string;
  dependencia: string | null;
  personalizavel: boolean;
}
export interface PerfilAcesso {
  id: number;
  codigo: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  sistema: boolean;
  permissoes: string[];
  versao: number;
  usuarios: number;
}
export type DadosPerfil = Pick<PerfilAcesso, 'nome' | 'descricao' | 'ativo' | 'permissoes'> & { versao?: number };
export const perfilAcessoService = {
  listar: () => api.get<PerfilAcesso[]>('/api/admin/perfis'),
  permissoes: () => api.get<PermissaoAcesso[]>('/api/admin/perfis/permissoes'),
  criar: (dados: DadosPerfil) => api.post<PerfilAcesso>('/api/admin/perfis', dados),
  atualizar: (id: number, dados: DadosPerfil) => api.put<PerfilAcesso>(`/api/admin/perfis/${id}`, dados),
};
