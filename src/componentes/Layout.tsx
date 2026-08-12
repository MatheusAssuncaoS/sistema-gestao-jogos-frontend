import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexto/useAuth';
import type { Papel } from '../servicos/tipos';

/**
 * Layout das áreas autenticadas: header com o nome do sistema, links de
 * navegação conforme o papel do usuário, e um botão de sair.
 *
 * O <Outlet /> é onde as rotas filhas são renderizadas. Assim cada tela não
 * precisa lidar com header nem com estilo global do container.
 */
export function Layout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();

  async function aoSair() {
    await sair();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-semibold text-gray-900">
            Sistema de Gestão de Jogos
          </Link>

          <nav className="flex items-center gap-6">
            {usuario && (
              <div className="flex gap-4 text-sm">
                {linksDoPapel(usuario.papeis)}
              </div>
            )}

            {usuario ? (
              <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                <span className="text-sm text-gray-700">{usuario.nome}</span>
                <button
                  onClick={aoSair}
                  className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sair
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-sm text-blue-600 hover:underline">
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function linksDoPapel(papeis: Papel[]) {
  const links: { rota: string; rotulo: string }[] = [];

  // Partidas é sempre visível: quem não é jogador ainda vê a mensagem de
  // "conta aguardando aprovação" ao clicar no link.
  links.push({ rota: '/partidas', rotulo: 'Partidas' });

  if (papeis.includes('JOGADOR')) {
    links.push({ rota: '/minhas-inscricoes', rotulo: 'Minhas inscrições' });
  }

  if (papeis.includes('ORGANIZADOR')) {
    links.push({ rota: '/organizador', rotulo: 'Gestão de partidas' });
  }

  if (papeis.includes('ADMINISTRADOR')) {
    links.push({ rota: '/admin', rotulo: 'Administração' });
  }

  return links.map((link) => (
    <NavLink
      key={link.rota}
      to={link.rota}
      className={({ isActive }) =>
        isActive
          ? 'font-medium text-blue-700'
          : 'text-gray-600 hover:text-gray-900'
      }
    >
      {link.rotulo}
    </NavLink>
  ));
}
