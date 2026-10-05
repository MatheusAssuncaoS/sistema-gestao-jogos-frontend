import { acessoAdministrativo, permissaoDaRota, pode } from '../seguranca/permissoes';
import { useState, type ComponentType } from 'react';
import {
  Ban,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  Gamepad2,
  Inbox,
  LayoutDashboard,
  List,
  LogOut,
  MapPin,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ShieldCheck,
  Shapes,
  Tags,
  Timer,
  Trophy,
  Users,
  X,
  type LucideProps,
} from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexto/useAuth';

type Icone = ComponentType<LucideProps>;

const destinos = [
  { rotulo: 'Tipos de suspensão', rota: '/admin/configuracoes/tipos-suspensao', icone: Ban },
  { rotulo: 'Perfil de Acesso', rota: '/admin/seguranca/perfis', icone: ShieldCheck },
  { rotulo: 'Usuário', rota: '/admin/seguranca/usuarios', icone: Users },
  { rotulo: 'Dashboard', rota: '/admin', icone: LayoutDashboard },
  { rotulo: 'Partidas', rota: '/admin/partidas', icone: Trophy },
  { rotulo: 'Calendário', rota: '/admin/partidas/calendario', icone: CalendarDays },
  { rotulo: 'Solicitações', rota: '/admin/cadastros', icone: Inbox },
  { rotulo: 'Jogadores', rota: '/admin/usuarios', icone: Users },
  { rotulo: 'Suspensões', rota: '/admin/suspensoes', icone: Ban },
  { rotulo: 'Locais', rota: '/admin/configuracoes/locais', icone: MapPin },
  { rotulo: 'Modalidades', rota: '/admin/configuracoes/modalidades', icone: Shapes },
  { rotulo: 'Bloqueios de Calendário', rota: '/admin/configuracoes/calendario', icone: Ban },
  { rotulo: 'Categorias', rota: '/admin/configuracoes/categorias', icone: Tags },
];

export function AdminLayout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAberto, setMenuAberto] = useState(false);
  const [recolhida, setRecolhida] = useState(() => window.localStorage.getItem('sidebar-admin-recolhida') === 'true');
  const [pesquisa, setPesquisa] = useState('');
  const [ambientesAbertos, setAmbientesAbertos] = useState(false);
  const [segurancaAberta, setSegurancaAberta] = useState(true);
  const [gestaoAberta, setGestaoAberta] = useState(true);
  const [pessoasAbertas, setPessoasAbertas] = useState(true);
  const [cadastrosAbertos, setCadastrosAbertos] = useState(location.pathname.startsWith('/admin/configuracoes'));
  const ambientes = [
    { rotulo: 'Administração', rota: '/admin', icone: ShieldCheck, disponivel: acessoAdministrativo(usuario) },
    { rotulo: 'Arbitragem', rota: '/arbitro', icone: Timer, disponivel: pode(usuario, 'ARBITRAGEM_VISUALIZAR') },
    { rotulo: 'Jogador', rota: '/partidas', icone: Gamepad2, disponivel: pode(usuario, 'INSCRICOES_VISUALIZAR') },
  ].filter((ambiente) => ambiente.disponivel);
  const resultados = pesquisa.trim() ? destinos.filter((destino) => (!permissaoDaRota(destino.rota) || pode(usuario, permissaoDaRota(destino.rota)!)) && destino.rotulo.toLocaleLowerCase('pt-BR').includes(pesquisa.trim().toLocaleLowerCase('pt-BR'))) : [];

  async function aoSair() {
    await sair();
    navigate('/login', { replace: true });
  }

  function navegarPara(rota: string) {
    setAmbientesAbertos(false);
    setMenuAberto(false);
    navigate(rota);
  }

  function alternarSidebar() {
    setRecolhida((valorAtual) => {
      const novoValor = !valorAtual;
      window.localStorage.setItem('sidebar-admin-recolhida', String(novoValor));
      return novoValor;
    });
  }

  return (
    <div className={`admin-shell club-shell ${recolhida ? 'admin-sidebar-collapsed' : ''}`}>
      {menuAberto && <button className="admin-sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMenuAberto(false)} />}
      <aside className={`admin-sidebar ${menuAberto ? 'admin-sidebar-open' : ''}`}>
        <div className="admin-brand">
          <span className="admin-brand-mark"><ShieldCheck aria-hidden="true" /></span>
          <strong>Clube<span>One</span></strong>
          <button className="admin-sidebar-close" type="button" aria-label="Fechar menu" onClick={() => setMenuAberto(false)}><X /></button>
        </div>

        <div className="admin-sidebar-search">
          {recolhida ? <button type="button" aria-label="Abrir pesquisa" title="Pesquisa" onClick={alternarSidebar}><Search /></button> : <label><Search aria-hidden="true" /><input value={pesquisa} onChange={(evento) => setPesquisa(evento.target.value)} placeholder="Pesquisa" aria-label="Pesquisar no menu" /></label>}
          {resultados.length > 0 && <div className="admin-sidebar-results">{resultados.map(({ rotulo, rota, icone: Icone }) => <button key={`${rotulo}-${rota}`} onClick={() => { navegarPara(rota); setPesquisa(''); }}><Icone /><span>{rotulo}</span></button>)}</div>}
        </div>

        <nav aria-label="Navegação administrativa">
          <ItemMenu rota="/admin" rotulo="Dashboard" icone={LayoutDashboard} fim aoNavegar={() => setMenuAberto(false)} />
          <p className="admin-nav-label">Plataforma</p>
          {pode(usuario, 'PARTIDAS_VISUALIZAR') && <GrupoMenu rotulo="Gestão" icone={Trophy} aberto={gestaoAberta} aoAlternar={() => setGestaoAberta((valor) => !valor)}>
            <ItemMenu rota="/admin/partidas/calendario" rotulo="Calendário" icone={CalendarDays} aoNavegar={() => setMenuAberto(false)} />
            <ItemMenu rota="/admin/partidas" rotulo="Partidas" icone={List} fim aoNavegar={() => setMenuAberto(false)} />
            <ItemMenu rota="/admin/partidas/nova" rotulo="Nova partida" icone={CalendarDays} aoNavegar={() => setMenuAberto(false)} />
          </GrupoMenu>}
          {(pode(usuario, 'JOGADORES_VISUALIZAR') || pode(usuario, 'SOLICITACOES_VISUALIZAR')) && <GrupoMenu rotulo="Pessoas" icone={Users} aberto={pessoasAbertas} aoAlternar={() => setPessoasAbertas((valor) => !valor)}>
            <ItemMenu rota="/admin/usuarios" rotulo="Jogadores" icone={Users} fim aoNavegar={() => setMenuAberto(false)} />
            <ItemMenu rota="/admin/cadastros" rotulo="Solicitações" icone={Inbox} aoNavegar={() => setMenuAberto(false)} />
            <ItemMenu rota="/admin/suspensoes" rotulo="Suspensões" icone={Ban} aoNavegar={() => setMenuAberto(false)} />
          </GrupoMenu>}
          {(pode(usuario, 'CADASTROS_VISUALIZAR') || pode(usuario, 'CALENDARIO_VISUALIZAR')) && <GrupoMenu rotulo="Cadastros" icone={Shapes} aberto={cadastrosAbertos} aoAlternar={() => setCadastrosAbertos((valor) => !valor)}>
            <ItemMenu rota="/admin/configuracoes/locais" rotulo="Locais" icone={MapPin} aoNavegar={() => setMenuAberto(false)} />
            <ItemMenu rota="/admin/configuracoes/modalidades" rotulo="Modalidades" icone={Shapes} aoNavegar={() => setMenuAberto(false)} />
            <ItemMenu rota="/admin/configuracoes/categorias" rotulo="Categorias" icone={Tags} aoNavegar={() => setMenuAberto(false)} />
            <ItemMenu rota="/admin/configuracoes/tipos-suspensao" rotulo="Tipos de suspensão" icone={Ban} aoNavegar={() => setMenuAberto(false)} />
            <ItemMenu rota="/admin/configuracoes/calendario" rotulo="Bloqueios de Calendário" icone={Ban} aoNavegar={() => setMenuAberto(false)} />
          </GrupoMenu>}

          {(pode(usuario, 'PERFIS_VISUALIZAR') || pode(usuario, 'USUARIOS_VISUALIZAR')) && <GrupoMenu rotulo="Segurança" icone={ShieldCheck} aberto={segurancaAberta} aoAlternar={() => setSegurancaAberta(valor => !valor)}>
            <ItemMenu rota="/admin/seguranca/perfis" rotulo="Perfil de Acesso" icone={ShieldCheck} aoNavegar={() => setMenuAberto(false)} />
            <ItemMenu rota="/admin/seguranca/usuarios" rotulo="Usuário" icone={Users} aoNavegar={() => setMenuAberto(false)} />
          </GrupoMenu>}

          <div className="admin-account-nav">
            <Link to="/admin/perfil" className="admin-account-card" title="Minha conta" onClick={() => setMenuAberto(false)}>
              <span className="admin-avatar" aria-hidden="true">{iniciais(usuario?.nome)}</span>
              <span><strong>{usuario?.nome ?? 'Administrador'}</strong><small>{usuario?.email ?? 'admin@clubeone.com.br'}</small></span>
              <ChevronRight />
            </Link>
            <button className="admin-account-logout" type="button" title="Sair" aria-label="Sair" onClick={aoSair}><LogOut /></button>
          </div>
        </nav>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-mobile-menu" type="button" aria-label="Abrir menu" onClick={() => setMenuAberto(true)}><Menu /></button>
          <button className="admin-desktop-sidebar-toggle" type="button" aria-label={recolhida ? 'Expandir menu' : 'Recolher menu'} onClick={alternarSidebar}>{recolhida ? <PanelLeftOpen /> : <PanelLeftClose />}</button>
          <span className="admin-topbar-divider" />
          <div className="admin-environment-wrap">
            <button className="admin-environment" type="button" aria-expanded={ambientesAbertos} onClick={() => setAmbientesAbertos((aberto) => !aberto)}>ClubeOne<ChevronDown aria-hidden="true" /></button>
            {ambientesAbertos && ambientes.length > 1 && <div className="admin-environment-menu" role="menu">{ambientes.map(({ rotulo, rota, icone: Icone }) => <button key={rota} type="button" role="menuitem" onClick={() => navegarPara(rota)} className={rota === '/admin' ? 'active' : ''}><Icone aria-hidden="true" /><span><strong>{rotulo}</strong><small>{rota === '/admin' ? 'Ambiente atual' : `Ir para ${rotulo.toLowerCase()}`}</small></span></button>)}</div>}
          </div>
          <ChevronRight className="admin-breadcrumb-chevron" />
          <span className="admin-breadcrumb-title">{tituloDaRota(location.pathname)}</span>
          <Link to="/admin/perfil" className="admin-topbar-account" aria-label="Minha conta"><CircleUserRound /></Link>
        </header>
        <main className="admin-content"><Outlet /></main>
      </div>
    </div>
  );
}

function GrupoMenu({ rotulo, icone: Icone, aberto, aoAlternar, children }: { rotulo: string; icone: Icone; aberto: boolean; aoAlternar: () => void; children: React.ReactNode }) {
  return <div className="admin-menu-group"><button type="button" className="admin-nav-item admin-nav-group" aria-expanded={aberto} title={rotulo} onClick={aoAlternar}><Icone aria-hidden="true" /><span>{rotulo}</span><ChevronDown aria-hidden="true" /></button>{aberto && <div className="admin-subnav">{children}</div>}</div>;
}

function ItemMenu({ rota, rotulo, icone: Icone, fim = false, aoNavegar }: { rota: string; rotulo: string; icone: Icone; fim?: boolean; aoNavegar: () => void }) {
  const { usuario } = useAuth();
  const permissao = permissaoDaRota(rota);
  if (permissao && !pode(usuario, permissao)) return null;
  return <NavLink to={rota} end={fim} onClick={aoNavegar} title={rotulo} className={({ isActive }) => `admin-nav-item ${isActive ? 'admin-nav-item-active' : ''}`}><Icone aria-hidden="true" /><span>{rotulo}</span></NavLink>;
}

function iniciais(nome?: string) {
  return nome?.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || 'AD';
}

function tituloDaRota(caminho: string) {
  if (caminho.includes('/tipos-suspensao')) return 'Tipos de suspensão';
  if (caminho === '/admin' || caminho === '/__design-preview') return 'Dashboard';
  if (caminho.includes('/partidas/nova')) return 'Nova partida';
  if (caminho.includes('/partidas/calendario')) return 'Calendário';
  if (caminho.includes('/partidas/')) return 'Detalhes da partida';
  if (caminho.endsWith('/partidas')) return 'Partidas';
  if (caminho.includes('/cadastros')) return 'Solicitações';
  if (caminho.includes('/suspensoes/nova')) return 'Registrar suspensão';
  if (caminho.includes('/suspensoes')) return 'Suspensões';
  if (caminho.endsWith('/seguranca/perfis/novo')) return 'Cadastrar perfil';
  if (caminho.includes('/seguranca/perfis/')) return 'Detalhes do perfil';
  if (caminho.includes('/seguranca/perfis')) return 'Perfis de acesso';
  if (caminho === '/admin/usuarios/novo') return 'Novo jogador';
  if (caminho.endsWith('/seguranca/usuarios/novo')) return 'Cadastrar usuário';
  if (caminho.startsWith('/admin/seguranca/usuarios/')) return 'Editar usuário';
  if (caminho.includes('/seguranca/usuarios')) return 'Usuário';
  if (/^\/admin\/usuarios\/.+/.test(caminho)) return 'Editar jogador';
  if (caminho.includes('/usuarios')) return 'Usuários';
  if (caminho.includes('/locais')) return 'Locais';
  if (caminho.includes('/modalidades')) return 'Modalidades';
  if (caminho.includes('/categorias')) return 'Categorias';
  if (caminho.includes('/calendario')) return 'Bloqueios de Calendário';
  if (caminho.includes('/perfil')) return 'Minha conta';
  return 'Administração';
}
