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

  // Usado depois da troca de senha: o endpoint responde 204, então o
  // frontend precisa buscar o usuário de novo para a flag senhaProvisoria
  // cair e o guard de rota parar de redirecionar.
  const recarregarUsuario = useCallback(async () => {
    setUsuario(await authService.eu());
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, carregando, entrar, sair, recarregarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}
