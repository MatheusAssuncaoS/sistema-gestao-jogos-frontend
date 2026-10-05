import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { authService, type CredenciaisLogin } from '../servicos/authService';
import { ApiError } from '../servicos/api';
import type { Usuario } from '../servicos/tipos';
import { AuthContext } from './authTypes';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
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
    queryClient.clear();
    setUsuario(autenticado);
    return autenticado;
  }, [queryClient]);

  const sair = useCallback(async () => {
    await authService.logout();
    queryClient.clear();
    setUsuario(null);
  }, [queryClient]);

  // Usado depois da troca de senha: o endpoint responde 204, então o
  // frontend precisa buscar o usuário de novo para a flag senhaProvisoria
  // cair e o guard de rota parar de redirecionar.
  const recarregarUsuario = useCallback(async () => {
    setUsuario(await authService.eu());
  }, []);

  useEffect(() => {
    if (!usuario) return;
    let ativo = true;
    const atualizar = () => {
      authService.eu().then(atualizado => {
        if (!ativo) return;
        if (JSON.stringify(atualizado.permissoes?.slice().sort()) !== JSON.stringify(usuario.permissoes?.slice().sort())) queryClient.clear();
        setUsuario(atualizado);
      }).catch(erro => {
        if (ativo && erro instanceof ApiError && (erro.status === 401 || erro.status === 403)) { queryClient.clear(); setUsuario(null); }
      });
    };
    window.addEventListener('focus', atualizar);
    const intervalo = window.setInterval(atualizar, 60_000);
    return () => { ativo = false; window.removeEventListener('focus', atualizar); window.clearInterval(intervalo); };
  }, [usuario, queryClient]);

  return (
    <AuthContext.Provider
      value={{ usuario, carregando, entrar, sair, recarregarUsuario, atualizarUsuario: setUsuario }}
    >
      {children}
    </AuthContext.Provider>
  );
}
