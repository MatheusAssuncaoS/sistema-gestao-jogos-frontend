import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { authService, type CredenciaisLogin } from '../servicos/authService';
import { ApiError } from '../servicos/api';
import type { Usuario } from '../servicos/tipos';
import { AuthContext } from './authTypes';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    authService
      .eu()
      .then(setUsuario)
      .catch((erro: unknown) => {
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
