import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../contexto/useAuth';
import type { Papel } from '../servicos/tipos';

interface Props {
  papelExigido: Papel;
}

/**
 * Restringe uma rota a um papel específico.
 *
 * Presume que a rota já está dentro de uma RotaProtegida, ou seja, que já
 * há usuário. Quem não tem o papel exigido vai para a página inicial
 * (que redireciona conforme o papel que ele TEM).
 */
export function RotaPorPapel({ papelExigido }: Props) {
  const { usuario } = useAuth();

  if (!usuario || !usuario.papeis.includes(papelExigido)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
