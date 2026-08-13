import { GestaoDeJogadores } from '../componentes/GestaoDeJogadores';
import { useAuth } from '../contexto/useAuth';
import { useNavigate } from 'react-router-dom';

export function AdminHome() {
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
          <div><strong>Gestão de Jogos</strong><small>Painel administrativo</small></div>
        </div>
        <nav aria-label="Navegação administrativa">
          <p className="admin-nav-label">GERENCIAMENTO</p>
          <a className="admin-nav-item admin-nav-item-active" href="#jogadores">
            <span aria-hidden="true">♙</span> Jogadores
          </a>
          <button className="admin-nav-item" type="button" disabled>
            <span aria-hidden="true">◇</span> Organizadores <small>em breve</small>
          </button>
          <p className="admin-nav-label">COMPETIÇÕES</p>
          <button className="admin-nav-item" type="button" disabled>
            <span aria-hidden="true">▦</span> Partidas <small>em breve</small>
          </button>
          <button className="admin-nav-item" type="button" disabled>
            <span aria-hidden="true">□</span> Calendário <small>em breve</small>
          </button>
        </nav>
        <div className="admin-sidebar-footer">Sistema de Gestão de Jogos<br /><span>Admin v1.0</span></div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>Painel administrativo</h1>
            <p>Gestão de cadastros e jogadores do clube</p>
          </div>
          <div className="admin-user">
            <span className="admin-avatar" aria-hidden="true">{usuario?.nome?.charAt(0).toUpperCase() ?? 'A'}</span>
            <span><strong>{usuario?.nome ?? 'Administrador'}</strong><small>Administrador</small></span>
            <button type="button" onClick={aoSair}>Sair</button>
          </div>
        </header>
        <main className="admin-content">
          <div className="admin-breadcrumb"><span>Início</span><b>/</b> Jogadores</div>
          <GestaoDeJogadores />
        </main>
      </div>
    </div>
  );
}
