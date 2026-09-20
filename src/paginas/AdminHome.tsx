import { useQueries, useQuery } from '@tanstack/react-query';
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  RefreshCw,
  ShieldAlert,
  UserPlus,
  UsersRound,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Button } from '../componentes/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../componentes/ui/card';
import { StatusBadge } from '../componentes/ui/StatusBadge';
import { adminJogadorService } from '../servicos/adminJogadorService';
import { adminUsuarioService } from '../servicos/adminUsuarioService';
import { organizadorPartidaService } from '../servicos/organizadorPartidaService';
import type { Inscrito, Jogador, Partida } from '../servicos/tipos';

const formatarHorario = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const formatarData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
const nomesDias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const coresCategorias = ['#079447', '#4cc779', '#a9e6bf', '#d9f3e2'];

export function AdminHome() {
  const location = useLocation();
  const modoPrevia = import.meta.env.DEV && location.pathname === '/__design-preview';
  const opcoesConsulta = { refetchInterval: 60_000, refetchIntervalInBackground: false, refetchOnWindowFocus: true };
  const usuarios = useQuery({ queryKey: ['admin', 'usuarios'], queryFn: adminUsuarioService.listar, ...opcoesConsulta });
  const pendentes = useQuery({ queryKey: ['admin', 'jogadores', 'pendentes'], queryFn: adminJogadorService.listarPendentes, ...opcoesConsulta });
  const jogadores = useQuery({ queryKey: ['admin', 'jogadores', 'ativos', 'dashboard'], queryFn: () => adminJogadorService.listarAtivos(''), ...opcoesConsulta });
  const partidas = useQuery({ queryKey: ['partidas', 'gestao'], queryFn: organizadorPartidaService.listar, ...opcoesConsulta });
  const consultasInscricoes = useQueries({ queries: (partidas.data ?? []).filter((partida) => !['CANCELADA', 'EXCLUIDA'].includes(partida.status)).slice(0, 30).map((partida) => ({ queryKey: ['partidas', partida.id, 'inscritos', 'dashboard'], queryFn: () => organizadorPartidaService.listarInscritos(partida.id), ...opcoesConsulta })) });

  const agora = new Date();
  const inicioHoje = inicioDoDia(agora);
  const fimHoje = new Date(inicioHoje.getTime() + 86_400_000);
  const inicioSemana = inicioDaSemana(agora);
  const todasPartidas = partidas.data ?? (modoPrevia ? partidasDemonstracao() : []);
  const partidasHoje = todasPartidas.filter((partida) => entre(partida.inicio, inicioHoje, fimHoje) && !['CANCELADA', 'EXCLUIDA'].includes(partida.status));
  const inscritos = modoPrevia ? inscricoesDemonstracao() : consultasInscricoes.flatMap((consulta) => consulta.data ?? []);
  const inscritosHoje = inscritos.filter((inscricao) => entre(inscricao.dataSolicitacao, inicioHoje, fimHoje)).length;
  const listaEspera = inscritos.filter((inscricao) => inscricao.status === 'LISTA_ESPERA');
  const proximas = todasPartidas.filter((partida) => new Date(partida.inicio) >= agora && !['CANCELADA', 'EXCLUIDA'].includes(partida.status)).sort(porInicio);
  const lotadas = proximas.filter((partida) => partida.status === 'LOTADA');
  const bloqueados = (usuarios.data ?? (modoPrevia ? usuariosDemonstracao : [])).filter((usuario) => usuario.status === 'BLOQUEADO');
  const partidasAbertas = proximas.filter((partida) => partida.status === 'ABERTA' || partida.status === 'LOTADA');
  const totalVagas = partidasAbertas.reduce((total, partida) => total + partida.capacidade, 0);
  const vagasOcupadas = partidasAbertas.reduce((total, partida) => total + (partida.quantidadeInscritos ?? 0), 0);
  const ocupacao = totalVagas ? Math.round((vagasOcupadas / totalVagas) * 100) : 0;
  const partidasSemEscala = proximas.filter((partida) => !partida.escalaPublicada && new Date(partida.inicio).getTime() <= agora.getTime() + 7 * 86_400_000);
  const graficoSemana = nomesDias.map((dia, indice) => ({
    dia,
    inscricoes: todasPartidas.filter((partida) => entre(partida.inicio, new Date(inicioSemana.getTime() + indice * 86_400_000), new Date(inicioSemana.getTime() + (indice + 1) * 86_400_000))).reduce((total, partida) => total + (partida.quantidadeInscritos ?? 0), 0),
  }));
  const categorias = agruparCategorias(jogadores.data ?? (modoPrevia ? jogadoresDemonstracao : []));
  const totalJogadores = categorias.reduce((total, categoria) => total + categoria.valor, 0);
  const presencas = inscritos.filter((inscricao) => inscricao.status === 'PRESENTE').length;
  const ausencias = inscritos.filter((inscricao) => inscricao.status === 'AUSENTE').length;
  const totalPendentes = pendentes.data?.length ?? (modoPrevia ? 3 : 0);
  const inscricoesCarregando = consultasInscricoes.some((consulta) => consulta.isPending);
  const carregando = !modoPrevia && (usuarios.isPending || pendentes.isPending || jogadores.isPending || partidas.isPending || inscricoesCarregando);
  const comErro = !modoPrevia && (usuarios.isError || pendentes.isError || jogadores.isError || partidas.isError || consultasInscricoes.some((consulta) => consulta.isError));

  function atualizar() {
    void Promise.all([usuarios.refetch(), pendentes.refetch(), jogadores.refetch(), partidas.refetch(), ...consultasInscricoes.map((consulta) => consulta.refetch())]);
  }

  return (
    <div className="club-dashboard">
      <header className="club-dashboard-heading">
        <div>
          <span className="club-dashboard-kicker">Painel administrativo</span>
          <h1>Visão geral do clube</h1>
          <p>Acompanhe o desempenho e o que precisa da sua atenção hoje.</p>
        </div>
        <div className="club-dashboard-heading-actions">
          <Button variant="outline" size="sm" onClick={atualizar} disabled={carregando}><RefreshCw className={carregando ? 'club-spin' : ''} />Atualizar</Button>
          <Button asChild size="sm"><Link to="/admin/partidas/nova"><CalendarPlus />Nova partida</Link></Button>
        </div>
      </header>

      {comErro && <div className="club-dashboard-notice" role="alert"><CircleAlert /><span>Alguns indicadores não puderam ser atualizados.</span><button onClick={atualizar}>Tentar novamente</button></div>}

      <section className="club-metrics" aria-label="Indicadores do clube">
        <Metrica titulo="Partidas hoje" valor={partidasHoje.length} detalhe="programadas para hoje" icone={CalendarDays} carregando={!modoPrevia && partidas.isPending} />
        <Metrica titulo="Inscritos hoje" valor={inscritosHoje} detalhe="novas inscrições hoje" icone={UsersRound} carregando={!modoPrevia && inscricoesCarregando} />
        <Metrica titulo="Lista de espera" valor={listaEspera.length} detalhe={`em ${lotadas.length} partidas lotadas`} icone={Clock3} carregando={!modoPrevia && inscricoesCarregando} />
        <Metrica titulo="Suspensões ativas" valor={bloqueados.length} detalhe="contas bloqueadas" icone={ShieldAlert} carregando={!modoPrevia && usuarios.isPending} alerta={bloqueados.length > 0} />
        <Metrica titulo="Taxa de ocupação" valor={`${ocupacao}%`} detalhe={`${vagasOcupadas} de ${totalVagas || 0} vagas`} icone={CheckCircle2} carregando={!modoPrevia && partidas.isPending} />
      </section>

      <section className="club-dashboard-grid club-dashboard-grid-main">
        <Card className="club-dashboard-card club-week-chart">
          <CardHeader><CardTitle>Inscrições da semana</CardTitle><span>{graficoSemana.reduce((total, item) => total + item.inscricoes, 0)} no período</span></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={graficoSemana} margin={{ top: 12, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#ecefed" />
                <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: '#737b76', fontSize: 11 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#737b76', fontSize: 10 }} />
                <Tooltip cursor={{ fill: '#f5f7f5' }} contentStyle={{ border: '1px solid #e3e7e4', borderRadius: 8, boxShadow: '0 8px 24px rgb(0 0 0 / 8%)', fontSize: 12 }} />
                <Bar dataKey="inscricoes" name="Inscrições" fill="#079447" radius={[5, 5, 2, 2]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="club-dashboard-card club-category-chart">
          <CardHeader><CardTitle>Jogadores por categoria</CardTitle></CardHeader>
          <CardContent>
            <div className="club-donut-wrap">
              <div className="club-donut-chart"><ResponsiveContainer width="100%" height={190}><PieChart><Pie data={categorias.length ? categorias : [{ nome: 'Sem categoria', valor: 1 }]} dataKey="valor" nameKey="nome" innerRadius={54} outerRadius={78} paddingAngle={1} stroke="#fff" strokeWidth={2}>{(categorias.length ? categorias : [{ nome: 'Sem categoria', valor: 1 }]).map((item, indice) => <Cell key={item.nome} fill={categorias.length ? coresCategorias[indice % coresCategorias.length] : '#e8ece9'} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><span><strong>{totalJogadores}</strong><small>Jogadores</small></span></div>
              <ul className="club-chart-legend">{categorias.slice(0, 4).map((categoria, indice) => <li key={categoria.nome}><i style={{ backgroundColor: coresCategorias[indice % coresCategorias.length] }} /><span><strong>{categoria.nome}</strong><small>{categoria.valor} ({totalJogadores ? Math.round((categoria.valor / totalJogadores) * 100) : 0}%)</small></span></li>)}</ul>
            </div>
          </CardContent>
        </Card>

        <Card className="club-dashboard-card club-upcoming">
          <CardHeader><CardTitle>Próximas partidas</CardTitle><Link to="/admin/partidas">Ver todas</Link></CardHeader>
          <CardContent>
            {proximas.length === 0 ? <EstadoVazio texto="Nenhuma partida programada." /> : <div className="club-upcoming-table"><div className="club-upcoming-header"><span>Horário</span><span>Partida</span><span>Inscritos</span><span>Status</span></div>{proximas.slice(0, 5).map((partida) => <Link to={`/admin/partidas/${partida.id}`} key={partida.id} className="club-upcoming-row"><span><strong>{formatarHorario.format(new Date(partida.inicio))}</strong><small>{formatarData.format(new Date(partida.inicio))}</small></span><span><strong>{partida.categoria ?? partida.modalidade}</strong><small>{partida.local}</small></span><span>{partida.quantidadeInscritos ?? 0}/{partida.capacidade}</span><StatusBadge status={partida.status} rotulo={rotuloStatus(partida.status)} /></Link>)}</div>}
          </CardContent>
        </Card>
      </section>

      <section className="club-dashboard-grid club-dashboard-grid-bottom">
        <Card className="club-dashboard-card club-alerts">
          <CardHeader><CardTitle>Alertas e pendências</CardTitle></CardHeader>
          <CardContent>
            <Alerta icone={Clock3} cor="yellow" texto={`${lotadas.length} ${lotadas.length === 1 ? 'partida lotada' : 'partidas lotadas'}`} rota="/admin/partidas" />
            <Alerta icone={CalendarDays} cor="orange" texto={`${partidasSemEscala.length} ${partidasSemEscala.length === 1 ? 'partida precisa' : 'partidas precisam'} de escalação`} rota="/admin/partidas" />
            <Alerta icone={UserPlus} cor="blue" texto={`${totalPendentes} cadastros aguardando aprovação`} rota="/admin/cadastros" />
            <Alerta icone={ShieldAlert} cor="red" texto={`${bloqueados.length} ${bloqueados.length === 1 ? 'conta bloqueada' : 'contas bloqueadas'}`} rota="/admin/usuarios" />
          </CardContent>
        </Card>

        <Card className="club-dashboard-card club-quick-actions">
          <CardHeader><CardTitle>Ações rápidas</CardTitle></CardHeader>
          <CardContent>
            <Link to="/admin/usuarios"><UserPlus /><span>Cadastrar jogador</span></Link>
            <Link to="/admin/partidas/nova"><CalendarPlus /><span>Nova partida</span></Link>
            <Link to="/admin/cadastros"><UsersRound /><span>Analisar cadastros</span></Link>
            <Link to="/admin/configuracoes/calendario"><CalendarDays /><span>Bloqueios de Calendário</span></Link>
          </CardContent>
        </Card>

        <Card className="club-dashboard-card club-attendance">
          <CardHeader><CardTitle>Presença x faltas</CardTitle><span>Histórico concluído</span></CardHeader>
          <CardContent>
            <div className="club-attendance-content">
              <div className="club-donut-chart club-attendance-chart"><ResponsiveContainer width="100%" height={180}><PieChart><Pie data={[{ nome: 'Presenças', valor: presencas || (ausencias ? 0 : 1) }, { nome: 'Faltas', valor: ausencias }]} dataKey="valor" innerRadius={52} outerRadius={72} startAngle={90} endAngle={-270} stroke="none"><Cell fill={presencas || ausencias ? '#079447' : '#e8ece9'} /><Cell fill="#d9ddda" /></Pie></PieChart></ResponsiveContainer><span><strong>{presencas + ausencias ? `${Math.round((presencas / (presencas + ausencias)) * 100)}%` : '—'}</strong><small>Presença</small></span></div>
              <dl><div><dt><i className="green" />Presenças</dt><dd>{presencas}</dd></div><div><dt><i />Faltas</dt><dd>{ausencias}</dd></div><div><dt>Total de registros</dt><dd>{presencas + ausencias}</dd></div></dl>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Metrica({ titulo, valor, detalhe, icone: Icone, carregando, alerta = false }: { titulo: string; valor: number | string; detalhe: string; icone: typeof CalendarDays; carregando: boolean; alerta?: boolean }) {
  return <Card className={`club-metric ${alerta ? 'club-metric-alert' : ''}`}><CardContent><span className="club-metric-icon"><Icone /></span><div><small>{titulo}</small><strong>{carregando ? '—' : valor}</strong><p>{detalhe}</p></div></CardContent></Card>;
}

function Alerta({ icone: Icone, cor, texto, rota }: { icone: typeof CalendarDays; cor: string; texto: string; rota: string }) {
  return <Link to={rota}><span className={`club-alert-icon ${cor}`}><Icone /></span><strong>{texto}</strong><ChevronRight /></Link>;
}

function EstadoVazio({ texto }: { texto: string }) {
  return <div className="club-empty"><CalendarDays /><p>{texto}</p></div>;
}

function inicioDoDia(data: Date) { const resultado = new Date(data); resultado.setHours(0, 0, 0, 0); return resultado; }
function inicioDaSemana(data: Date) { const resultado = inicioDoDia(data); const dia = resultado.getDay() || 7; resultado.setDate(resultado.getDate() - dia + 1); return resultado; }
function entre(valor: string, inicio: Date, fim: Date) { const data = new Date(valor); return data >= inicio && data < fim; }
function porInicio(a: Partida, b: Partida) { return new Date(a.inicio).getTime() - new Date(b.inicio).getTime(); }
function agruparCategorias(jogadores: readonly Jogador[]) {
  const contagem = new Map<string, number>();
  jogadores.forEach((jogador) => contagem.set(jogador.categoria ?? 'Sem categoria', (contagem.get(jogador.categoria ?? 'Sem categoria') ?? 0) + 1));
  return [...contagem.entries()].map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);
}
function rotuloStatus(status: Partida['status']) { return ({ RASCUNHO: 'Rascunho', ABERTA: 'Aberta', LOTADA: 'Lotada', ENCERRADA: 'Encerrada', FINALIZADA: 'Finalizada', CANCELADA: 'Cancelada', EXCLUIDA: 'Excluída' } as const)[status]; }

const usuariosDemonstracao = [
  { id: '1', nome: 'Carlos Almeida', email: 'carlos@clubeone.com.br', status: 'ATIVO', papeis: ['JOGADOR'], versao: 1 },
  { id: '2', nome: 'Rafael Lima', email: 'rafael@clubeone.com.br', status: 'BLOQUEADO', papeis: ['JOGADOR'], versao: 1 },
  { id: '3', nome: 'Ana Souza', email: 'ana@clubeone.com.br', status: 'BLOQUEADO', papeis: ['JOGADOR'], versao: 1 },
] as const;
const jogadoresDemonstracao = [
  { id: '1', usuarioId: '1', nome: 'Carlos Almeida', email: 'carlos@clubeone.com.br', matriculaAssociado: '1', categoria: 'Série A', situacaoAssociativa: 'REGULAR', aprovadoEm: '' },
  { id: '2', usuarioId: '2', nome: 'Rafael Lima', email: 'rafael@clubeone.com.br', matriculaAssociado: '2', categoria: 'Série A', situacaoAssociativa: 'REGULAR', aprovadoEm: '' },
  { id: '3', usuarioId: '3', nome: 'Ana Souza', email: 'ana@clubeone.com.br', matriculaAssociado: '3', categoria: 'Série B', situacaoAssociativa: 'REGULAR', aprovadoEm: '' },
  { id: '4', usuarioId: '4', nome: 'João Dias', email: 'joao@clubeone.com.br', matriculaAssociado: '4', categoria: 'Série B', situacaoAssociativa: 'REGULAR', aprovadoEm: '' },
  { id: '5', usuarioId: '5', nome: 'Bia Melo', email: 'bia@clubeone.com.br', matriculaAssociado: '5', categoria: 'Série B', situacaoAssociativa: 'REGULAR', aprovadoEm: '' },
  { id: '6', usuarioId: '6', nome: 'Leo Reis', email: 'leo@clubeone.com.br', matriculaAssociado: '6', categoria: 'Série C', situacaoAssociativa: 'REGULAR', aprovadoEm: '' },
] as const;
function partidasDemonstracao(): Partida[] {
  return [
    partidaDemonstracao('1', 0, 8, 'Série C', 'Campo 1', 16, 16, 'LOTADA', true),
    partidaDemonstracao('2', 0, 10, 'Série B', 'Campo 1', 14, 16, 'ABERTA', true),
    partidaDemonstracao('3', 0, 19, 'Série A', 'Campo 2', 10, 16, 'ABERTA', false),
    partidaDemonstracao('4', 1, 9, 'Série B', 'Campo 2', 8, 16, 'ABERTA', true),
    partidaDemonstracao('5', 2, 18, 'Série A', 'Ginásio', 15, 16, 'ABERTA', false),
    partidaDemonstracao('6', 3, 10, 'Série C', 'Campo 1', 16, 16, 'LOTADA', true),
    partidaDemonstracao('7', 4, 16, 'Série B', 'Campo 2', 12, 16, 'ABERTA', true),
  ];
}
function partidaDemonstracao(id: string, dias: number, hora: number, categoria: string, local: string, inscritos: number, capacidade: number, status: Partida['status'], escalaPublicada: boolean): Partida {
  const inicio = inicioDoDia(new Date()); inicio.setDate(inicio.getDate() + dias); inicio.setHours(hora);
  return { id, duracaoMinutos: 60, modalidade: 'Futebol', local, categoria, inicio: inicio.toISOString(), capacidade, quantidadeInscritos: inscritos, status, inscricoesAbremEm: null, inscricoesEncerramEm: null, escalaPublicada, versao: 1, equipes: [], arbitragem: { status: 'PREPARACAO', golsAmarelo: 0, golsAzul: 0, totalGols: 0, totalPunicoes: 0, cartoesAmarelos: 0, cartoesVermelhos: 0, expulsos: 0, acrescimos: 0, segundos: 0 } };
}
function inscricoesDemonstracao(): Inscrito[] {
  const agora = new Date().toISOString();
  return Array.from({ length: 45 }, (_, indice) => ({ inscricaoId: String(indice + 1), jogadorId: String(indice + 1), nome: `Jogador ${indice + 1}`, categoria: indice % 3 === 0 ? 'Série A' : indice % 3 === 1 ? 'Série B' : 'Série C', status: indice < 4 ? 'LISTA_ESPERA' : indice < 36 ? 'PRESENTE' : 'AUSENTE', dataSolicitacao: agora }));
}
