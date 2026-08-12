import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { authService, type CredenciaisLogin } from '../servicos/authService';
import { ApiError } from '../servicos/api';
import type { Usuario } from '../servicos/tipos';

/**
 * Contexto de autenticação.
 *
 * No boot do app chama GET /api/auth/eu para descobrir se há sessão ativa
 * (o backend responde 200 com o usuário ou 401 sem sessão). O resultado
 * fica em memória para as telas consultarem sem novo round-trip.
 *
 * Um estado carregando explícito evita que a UI mostre "não autenticado"
 * por milissegundos enquanto a primeira requisição está em voo.
 */

interface AuthContextValue {
  usuario: Usuario | null;
  carregando: boolean;
  entrar: (credenciais: CredenciaisLogin) => Promise<Usuario>;
  sair: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    authService
      .eu()
      .then(setUsuario)
      .catch((erro: unknown) => {
        // 401 na inicialização é esperado: significa que ninguém está logado.
        // Qualquer outro erro é propagado para o console, para não engolir
        // problemas de configuração como um backend fora do ar.
        if (!(erro instanceof ApiError) || erro.status !== 401) {
          console.error('Falha ao consultar o usuário autenticado.', erro);
        }
      })
      .finally(() => setCarregando(false));
  }, []);

  const entrar = useCallback(async (credenciais: CredenciaisLogin) => {
    const autenticado = await authService.login(credenciais);
    setUsuario(autenticado);
    return autenticado;
  }, []);

  const sair = useCallback(async () => {
    await authService.logout();
    setUsuario(null);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, sair }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error('useAuth precisa ser usado dentro de um AuthProvider.');
  }

  return contexto;
}
