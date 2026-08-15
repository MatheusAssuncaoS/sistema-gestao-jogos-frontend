import { api } from './api';
import type { Usuario } from './tipos';

export interface CredenciaisLogin {
  email: string;
  senha: string;
}

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
}

export interface DadosTrocaSenha {
  senhaAtual: string;
  novaSenha: string;
}

/**
 * Funções específicas dos endpoints de autenticação. Cada tela chama estas
 * funções em vez de fetch direto, o que mantém a URL do endpoint em um
 * lugar só.
 */
export const authService = {
  eu: () => api.get<Usuario>('/api/auth/eu'),

  login: (credenciais: CredenciaisLogin) =>
    api.post<Usuario>('/api/auth/login', credenciais),

  logout: () => api.post<void>('/api/auth/logout'),

  cadastrar: (dados: DadosCadastro) =>
    api.post<Usuario>('/api/auth/cadastro', dados),

  trocarSenha: (dados: DadosTrocaSenha) =>
    api.post<void>('/api/auth/trocar-senha', dados),
};
