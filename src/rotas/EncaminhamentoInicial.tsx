import { Navigate } from 'react-router-dom';

import { useAuth } from '../contexto/useAuth';

/**
 * Rota "/" que decide para onde mandar o usuário conforme o papel dele.
 *
 * É a mesma lógica do redirecionamento após o login, centralizada aqui
 * para funcionar quando o usuário acessa a raiz diretamente pela URL.
 */
export function EncaminhamentoInicial() {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return null;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.papeis.includes('ADMINISTRADOR')) {
    return <Navigate to="/admin" replace />;
  }

  if (usuario.papeis.includes('ORGANIZADOR')) {
    return <Navigate to="/organizador" replace />;
  }

  return <Navigate to="/partidas" replace />;
}
