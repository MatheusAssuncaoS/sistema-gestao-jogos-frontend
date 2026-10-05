import { acessoAdministrativo, pode } from '../seguranca/permissoes';
import { useState, type ComponentType, type ReactNode } from 'react';
import { ChevronDown, CircleUserRound, Gamepad2, LogOut, Menu, ShieldCheck, Timer, X, type LucideProps } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexto/useAuth';

type Ambiente = 'arbitro';
type Icone = ComponentType<LucideProps>;

const configuracao: Record<Ambiente, { titulo: string; subtitulo: string; secao: string; icone: Icone }> = {
  arbitro: { titulo: 'Arbitragem', subtitulo: 'Preparação e condução de partidas', secao: 'Central do árbitro', icone: Timer },
};

export function PainelOperacionalLayout({ ambiente, children }: { ambiente: Ambiente; children: ReactNode }) {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const [ambientesAbertos, setAmbientesAbertos] = useState(false);
  const atual = configuracao[ambiente];
  const IconeAtual = atual.icone;
  const ambientes = [
    { rotulo: 'Administração', rota: '/admin', icone: ShieldCheck, disponivel: acessoAdministrativo(usuario) },
    { rotulo: 'Arbitragem', rota: '/arbitro', icone: Timer, disponivel: pode(usuario, 'ARBITRAGEM_VISUALIZAR') },
    { rotulo: 'Jogador', rota: '/partidas', icone: Gamepad2, disponivel: usuario?.papeis.includes('JOGADOR') },
  ].filter((item) => item.disponivel);

  async function aoSair() { await sair(); navigate('/login', { replace: true }); }
  function navegarPara(rota: string) { setAmbientesAbertos(false); setMenuAberto(false); navigate(rota); }

  return <div className={`admin-shell operational-shell operational-${ambiente}`}>
    {menuAberto && <button className="admin-sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMenuAberto(false)} />}
    <aside className={`admin-sidebar ${menuAberto ? 'admin-sidebar-open' : ''}`}>
      <div className="admin-brand"><span className="admin-brand-mark">G</span><strong>GameDash</strong><button className="admin-sidebar-close" type="button" aria-label="Fechar menu" onClick={() => setMenuAberto(false)}><X /></button></div>
      <nav aria-label={`Navegação de ${atual.titulo.toLowerCase()}`}>
        <p className="admin-nav-label">{atual.titulo}</p>
        <button className="admin-nav-item admin-nav-item-active" type="button" onClick={() => setMenuAberto(false)}><IconeAtual aria-hidden="true" />{atual.secao}</button>
        <div className="admin-account-nav">
          <Link to="/meus-dados" className="admin-nav-item" onClick={() => setMenuAberto(false)}><CircleUserRound aria-hidden="true" />Minha conta</Link>
          <button className="admin-nav-item" type="button" onClick={aoSair}><LogOut aria-hidden="true" />Sair</button>
        </div>
      </nav>
    </aside>
    <div className="admin-main">
      <header className="admin-topbar">
        <button className="admin-mobile-menu" type="button" aria-label="Abrir menu" onClick={() => setMenuAberto(true)}><Menu /></button>
        <div className="operational-mobile-title"><strong>{atual.secao}</strong><small>{atual.titulo}</small></div>
        <div className="admin-environment-wrap">
          <button className="admin-environment" type="button" aria-expanded={ambientesAbertos} onClick={() => setAmbientesAbertos((aberto) => !aberto)}><IconeAtual aria-hidden="true" />{atual.titulo}<ChevronDown aria-hidden="true" /></button>
          {ambientesAbertos && ambientes.length > 1 && <div className="admin-environment-menu" role="menu">{ambientes.map(({ rotulo, rota, icone: Icon }) => <button key={rota} type="button" role="menuitem" onClick={() => navegarPara(rota)} className={rotulo === atual.titulo ? 'active' : ''}><Icon aria-hidden="true" /><span><strong>{rotulo}</strong><small>{rotulo === atual.titulo ? 'Ambiente atual' : `Ir para ${rotulo.toLowerCase()}`}</small></span></button>)}</div>}
        </div>
        <div className="admin-page-title"><h1>{atual.titulo}</h1><p>{atual.subtitulo}</p></div>
        <div className="admin-user"><span className="admin-avatar" aria-hidden="true">{iniciais(usuario?.nome)}</span><Link to="/meus-dados" className="admin-user-profile-link"><strong>{usuario?.nome ?? atual.titulo}</strong><small>{atual.titulo}</small></Link></div>
      </header>
      <main className="admin-content">{children}</main>
    </div>
  </div>;
}

function iniciais(nome?: string) {
  const partes = nome?.trim().split(/\s+/).filter(Boolean) ?? [];
  return partes.slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || 'GG';
}
