import { GestaoDeJogadores } from '../componentes/GestaoDeJogadores';
import { GestaoDePartidas } from '../componentes/GestaoDePartidas';
import { GestaoDeOrganizadores } from '../componentes/GestaoDeOrganizadores';
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
          <span className="admin-brand-mark">G</span>
          <div><strong>Game<span>Dash.</span></strong><small>Gestão esportiva</small></div>
        </div>
        <nav aria-label="Navegação administrativa">
          <p className="admin-nav-label">MENU</p>
          <a className="admin-nav-item" href="#resumo">
            <span aria-hidden="true">⌂</span> Visão geral
          </a>
          <a className="admin-nav-item admin-nav-item-active" href="#jogadores">
            <span aria-hidden="true">♙</span> Jogadores
          </a>
          <a className="admin-nav-item" href="#organizadores">
            <span aria-hidden="true">◇</span> Organizadores
          </a>
          <a className="admin-nav-item" href="#partidas">
            <span aria-hidden="true">▦</span> Partidas
          </a>
          <button className="admin-nav-item" type="button" disabled>
            <span aria-hidden="true">□</span> Calendário <small>em breve</small>
          </button>
        </nav>
        <div className="admin-sidebar-footer">Sistema de Gestão de Jogos<br /><span>Admin v1.0</span></div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>Jogadores</h1>
            <p>Gerencie os membros e acessos do clube</p>
          </div>
          <label className="admin-global-search">
            <span aria-hidden="true">⌕</span>
            <input type="search" placeholder="Buscar no painel" />
          </label>
          <div className="admin-user">
            <button className="admin-icon-button" type="button" aria-label="Notificações">♢</button>
            <span className="admin-avatar" aria-hidden="true">{usuario?.nome?.charAt(0).toUpperCase() ?? 'A'}</span>
            <span><strong>{usuario?.nome ?? 'Administrador'}</strong><small>Administrador</small></span>
            <button type="button" onClick={aoSair}>Sair</button>
          </div>
        </header>
        <main className="admin-content">
          <section id="resumo" className="admin-summary" aria-label="Resumo administrativo">
            <article><span className="admin-summary-icon admin-summary-blue">♙</span><div><strong>Jogadores ativos</strong><small>Cadastros aprovados</small></div><b>Ativos</b></article>
            <article><span className="admin-summary-icon admin-summary-yellow">◷</span><div><strong>Aprovações</strong><small>Novos cadastros</small></div><b>Pendentes</b></article>
            <article><span className="admin-summary-icon admin-summary-cyan">▦</span><div><strong>Partidas</strong><small>Agenda do clube</small></div><b>Gerenciar</b></article>
          </section>
          <GestaoDeJogadores />
          <div className="mt-8">
            <GestaoDeOrganizadores />
          </div>
          <div className="mt-8">
            <GestaoDePartidas somenteLeitura />
          </div>
        </main>
      </div>
    </div>
  );
}
