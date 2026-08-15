import { useState, type ComponentType } from 'react';
import { CalendarDays, ChevronDown, CircleUserRound, Gamepad2, Inbox, LayoutDashboard, LogOut, MapPin, Menu, Settings2, ShieldCheck, Shapes, Tags, Trophy, Users, X, type LucideProps } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexto/useAuth';

type Icone = ComponentType<LucideProps>;

export function AdminLayout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const [ambientesAbertos, setAmbientesAbertos] = useState(false);
  const [configuracoesAbertas, setConfiguracoesAbertas] = useState(location.pathname.startsWith('/admin/configuracoes'));
  const ambientes = [
    { rotulo: 'Administração', rota: '/admin', icone: ShieldCheck, disponivel: usuario?.papeis.includes('ADMINISTRADOR') },
    { rotulo: 'Organização', rota: '/organizador', icone: Trophy, disponivel: usuario?.papeis.includes('ORGANIZADOR') },
    { rotulo: 'Jogador', rota: '/partidas', icone: Gamepad2, disponivel: usuario?.papeis.includes('JOGADOR') },
  ].filter((ambiente) => ambiente.disponivel);

  async function aoSair() {
    await sair();
    navigate('/login', { replace: true });
  }

  function navegarPara(rota: string) {
    setAmbientesAbertos(false);
    setMenuAberto(false);
    navigate(rota);
  }

  return (
    <div className="admin-shell">
      {menuAberto && <button className="admin-sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMenuAberto(false)} />}
      <aside className={`admin-sidebar ${menuAberto ? 'admin-sidebar-open' : ''}`}>
        <div className="admin-brand"><span className="admin-brand-mark">G</span><strong>GameDash</strong><button className="admin-sidebar-close" type="button" aria-label="Fechar menu" onClick={() => setMenuAberto(false)}><X /></button></div>
        <nav aria-label="Navegação administrativa">
          <p className="admin-nav-label">Administração</p>
          <ItemMenu rota="/admin" rotulo="Visão geral" icone={LayoutDashboard} fim aoNavegar={() => setMenuAberto(false)} />
          <ItemMenu rota="/admin/cadastros" rotulo="Solicitações" icone={Inbox} aoNavegar={() => setMenuAberto(false)} />
          <ItemMenu rota="/admin/usuarios" rotulo="Usuários" icone={Users} aoNavegar={() => setMenuAberto(false)} />
          <ItemMenu rota="/admin/partidas" rotulo="Partidas" icone={CalendarDays} aoNavegar={() => setMenuAberto(false)} />
          <button type="button" className={`admin-nav-item admin-nav-group ${location.pathname.startsWith('/admin/configuracoes') ? 'admin-nav-group-active' : ''}`} aria-expanded={configuracoesAbertas} onClick={() => setConfiguracoesAbertas((aberto) => !aberto)}><Settings2 aria-hidden="true" />Configurações<ChevronDown aria-hidden="true" /></button>
          {configuracoesAbertas && <div className="admin-subnav">
            <ItemMenu rota="/admin/configuracoes/modalidades" rotulo="Modalidades" icone={Shapes} aoNavegar={() => setMenuAberto(false)} />
            <ItemMenu rota="/admin/configuracoes/locais" rotulo="Locais" icone={MapPin} aoNavegar={() => setMenuAberto(false)} />
            <ItemMenu rota="/admin/configuracoes/categorias" rotulo="Categorias" icone={Tags} aoNavegar={() => setMenuAberto(false)} />
            <ItemMenu rota="/admin/configuracoes/calendario" rotulo="Calendário" icone={CalendarDays} aoNavegar={() => setMenuAberto(false)} />
          </div>}
          <div className="admin-account-nav">
            <ItemMenu rota="/admin/perfil" rotulo="Minha conta" icone={CircleUserRound} aoNavegar={() => setMenuAberto(false)} />
            <button className="admin-nav-item" type="button" onClick={aoSair}><LogOut aria-hidden="true" />Sair</button>
          </div>
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-mobile-menu" type="button" aria-label="Abrir menu" onClick={() => setMenuAberto(true)}><Menu /></button>
          <div className="admin-environment-wrap">
            <button className="admin-environment" type="button" aria-expanded={ambientesAbertos} onClick={() => setAmbientesAbertos((aberto) => !aberto)}><ShieldCheck aria-hidden="true" />Administração<ChevronDown aria-hidden="true" /></button>
            {ambientesAbertos && ambientes.length > 1 && <div className="admin-environment-menu" role="menu">{ambientes.map(({ rotulo, rota, icone: Icon }) => <button key={rota} type="button" role="menuitem" onClick={() => navegarPara(rota)} className={rota === '/admin' ? 'active' : ''}><Icon aria-hidden="true" /><span><strong>{rotulo}</strong><small>{rota === '/admin' ? 'Ambiente atual' : `Ir para ${rotulo.toLowerCase()}`}</small></span></button>)}</div>}
          </div>
          <div className="admin-user"><span className="admin-avatar" aria-hidden="true">{iniciais(usuario?.nome)}</span><Link to="/admin/perfil" className="admin-user-profile-link"><strong>{usuario?.nome ?? 'Administrador'}</strong><small>Administrador</small></Link></div>
        </header>
        <main className="admin-content"><Outlet /></main>
      </div>
    </div>
  );
}

function iniciais(nome?: string) {
  const partes = nome?.trim().split(/\s+/).filter(Boolean) ?? [];
  return partes.slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || 'AD';
}

function ItemMenu({ rota, rotulo, icone: Icon, fim = false, aoNavegar }: { rota: string; rotulo: string; icone: Icone; fim?: boolean; aoNavegar: () => void }) {
  return <NavLink to={rota} end={fim} onClick={aoNavegar} className={({ isActive }) => `admin-nav-item ${isActive ? 'admin-nav-item-active' : ''}`}><Icon aria-hidden="true" />{rotulo}</NavLink>;
}
