import { createContext } from 'react';

import type { CredenciaisLogin } from '../servicos/authService';
import type { Usuario } from '../servicos/tipos';

export interface AuthContextValue {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (credenciais: CredenciaisLogin) => Promise<Usuario>;
  sair: () => Promise<void>;
  recarregarUsuario: () => Promise<void>;
  atualizarUsuario: (usuario: Usuario) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
