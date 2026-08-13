import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../contexto/useAuth';
import { devePedirTrocaDeSenha } from './trocaSenhaObrigatoria';

/**
 * Envolve rotas que exigem usuário autenticado.
 *
 * Enquanto o AuthContext ainda está checando a sessão no boot, mostra uma
 * mensagem simples de carregamento em vez de decidir. Isso evita o
 * "piscar" de conteúdo público antes do redirecionamento.
 *
 * Quem chega sem sessão vai para /login com o caminho original guardado
 * no state.de, para a tela de login poder voltar para onde o usuário
 * queria depois de entrar.
 *
 * Quem tem uma senha provisória vai para /trocar-senha antes de qualquer
 * outra rota: é o mesmo tipo de checagem que a de sessão, só que a decisão
 * em si mora em devePedirTrocaDeSenha, para poder ser testada sem montar
 * componente.
 */
export function RotaProtegida() {
  const { usuario, carregando } = useAuth();
  const localizacao = useLocation();

  if (carregando) {
    return <MensagemCarregando />;
  }

  if (!usuario) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ de: localizacao.pathname + localizacao.search }}
      />
    );
  }

  if (devePedirTrocaDeSenha(usuario, localizacao.pathname)) {
    return <Navigate to="/trocar-senha" replace />;
  }

  return <Outlet />;
}

function MensagemCarregando() {
  return (
    <div className="flex min-h-screen items-center justify-center text-gray-500">
      Carregando...
    </div>
  );
}
