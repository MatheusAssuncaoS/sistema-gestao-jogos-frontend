import { useNavigate } from 'react-router-dom';

import { GestaoDePartidas } from '../componentes/GestaoDePartidas';
import { useAuth } from '../contexto/useAuth';

export function OrganizadorHome() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();

  async function aoSair() {
    await sair();
    navigate('/login', { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">SJ</span>
          <div><strong>Gestão de Jogos</strong><small>Painel do organizador</small></div>
        </div>
        <nav aria-label="Navegação do organizador">
          <p className="admin-nav-label">GESTÃO</p>
          <a className="admin-nav-item admin-nav-item-active" href="#partidas">
            <span aria-hidden="true">▦</span> Partidas
          </a>
        </nav>
        <div className="admin-sidebar-footer">Sistema de Gestão de Jogos<br /><span>Organizador v1.0</span></div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>Painel do organizador</h1>
            <p>Gestão de partidas do clube</p>
          </div>
          <div className="admin-user">
            <span className="admin-avatar" aria-hidden="true">{usuario?.nome?.charAt(0).toUpperCase() ?? 'O'}</span>
            <span><strong>{usuario?.nome ?? 'Organizador'}</strong><small>Organizador</small></span>
            <button type="button" onClick={aoSair}>Sair</button>
          </div>
        </header>
        <main className="admin-content">
          <div className="admin-breadcrumb"><span>Início</span><b>/</b> Partidas</div>
          <GestaoDePartidas />
        </main>
      </div>
    </div>
  );
}
