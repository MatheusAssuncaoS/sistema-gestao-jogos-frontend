import { CalendarDays, ClipboardCheck, LogOut, Settings, ShieldCheck, Timer, UserRound } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/useAuth';

export function Layout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const temShellProprio = location.pathname.startsWith('/admin') || location.pathname.startsWith('/organizador') || location.pathname.startsWith('/arbitro');

  async function aoSair() { await sair(); navigate('/login', { replace: true }); }
  if (temShellProprio) return <Outlet />;

  const inicial = usuario?.nome.trim().charAt(0).toUpperCase() || 'J';
  const jogadorAtivo = usuario?.papeis.includes('JOGADOR');
  return (
    <div className="player-shell">
      <header className="player-topbar">
        <Link to="/partidas" className="player-brand" aria-label="ClubeOne">
          <span className="player-brand-mark"><ShieldCheck aria-hidden="true" /></span>
          <strong>Clube<span>One</span></strong>
        </Link>
        {usuario && <div className="player-account">
          <span className="player-account-name">Olá, {usuario.nome.split(' ')[0]}</span>
          <Link to="/meus-dados" className="player-avatar" aria-label="Abrir meus dados">{inicial}</Link>
          <button type="button" onClick={aoSair} className="player-logout" aria-label="Sair"><LogOut size={19} /></button>
        </div>}
      </header>
      <main className="player-main"><Outlet /></main>
      {usuario && <nav className="player-bottom-nav" aria-label="Navegação principal">
        <PlayerLink to="/partidas" label="Partidas" icon={<CalendarDays />} />
        {jogadorAtivo && <PlayerLink to="/minhas-inscricoes" label="Inscrições" icon={<ClipboardCheck />} />}
        <PlayerLink to="/meus-dados" label="Meus dados" icon={<UserRound />} />
        {usuario.papeis.includes('ORGANIZADOR') && <PlayerLink to="/organizador" label="Organizar" icon={<Settings />} />}
        {usuario.papeis.includes('ARBITRO') && <PlayerLink to="/arbitro" label="Arbitrar" icon={<Timer />} />}
        {usuario.papeis.includes('ADMINISTRADOR') && <PlayerLink to="/admin" label="Administrar" icon={<ShieldCheck />} />}
      </nav>}
    </div>
  );
}

function PlayerLink({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return <NavLink to={to} className={({ isActive }) => `player-nav-link${isActive ? ' active' : ''}`}><span>{icon}</span><small>{label}</small></NavLink>;
}
