import { CalendarDays, ChevronLeft, ChevronRight, Funnel, List, Plus, RotateCcw, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';

import { Paginacao } from '../componentes/ui/Paginacao';
import { AvisoTemporario } from '../componentes/ui/AvisoTemporario';
import { ApiError } from '../servicos/api';
import { organizadorPartidaService } from '../servicos/organizadorPartidaService';
import type { Partida, StatusArbitragem, StatusPartida } from '../servicos/tipos';

const rotulosStatus: Record<StatusPartida, string> = { RASCUNHO: 'Rascunho', ABERTA: 'Aberta', LOTADA: 'Lotada', ENCERRADA: 'Encerrada', FINALIZADA: 'Finalizada', CANCELADA: 'Cancelada' };
const rotulosArbitragem: Record<StatusArbitragem, string> = { PREPARACAO: 'Não iniciada', EM_ANDAMENTO: 'Em andamento', PAUSADA: 'Pausada', FINALIZADA: 'Finalizada' };
const formatoData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const formatoDiaCalendario = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' });
const formatoDiaSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });

function mensagemDeErro(falha: unknown) {
  return falha instanceof ApiError ? falha.detail : 'Não foi possível carregar as partidas. Tente novamente.';
}

export function AdminPartidasPage({ visualizacaoInicial = 'lista' }: { visualizacaoInicial?: 'calendario' | 'lista' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const visualizacao = visualizacaoInicial;
  const [diaCalendario, setDiaCalendario] = useState(() => dataLocal(new Date()));
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [status, setStatus] = useState<StatusPartida | 'TODOS'>('TODOS');
  const [periodo, setPeriodo] = useState<'PROXIMOS_30' | 'ULTIMOS_30' | 'PERSONALIZADO' | 'TODOS'>('PROXIMOS_30');
  const [categoria, setCategoria] = useState('TODAS');
  const [diaSemana, setDiaSemana] = useState('TODOS');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [aviso, setAviso] = useState(() => (location.state as { aviso?: string } | null)?.aviso ?? '');
  const partidas = useQuery({ queryKey: ['partidas', 'gestao'], queryFn: organizadorPartidaService.listar });
  const categoriasDisponiveis = useMemo(() => [...new Set((partidas.data ?? []).map((item) => item.categoria ?? 'Todas as categorias'))].sort(), [partidas.data]);

  useEffect(() => {
    const temporizador = window.setTimeout(() => setBuscaAplicada(busca), 300);
    return () => window.clearTimeout(temporizador);
  }, [busca]);
  useEffect(() => { if ((location.state as { aviso?: string } | null)?.aviso) navigate(location.pathname, { replace: true, state: null }); }, [location.pathname, location.state, navigate]);

  const filtradas = useMemo(() => {
    const termo = buscaAplicada.trim().toLocaleLowerCase('pt-BR');
    const agora = Date.now();
    const limite = 30 * 24 * 60 * 60 * 1000;
    return (partidas.data ?? []).filter((partida) => {
      const inicio = new Date(partida.inicio).getTime();
      const inicioPersonalizado = dataInicial ? new Date(`${dataInicial}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
      const fimPersonalizado = dataFinal ? new Date(`${dataFinal}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
      const correspondePeriodo = periodo === 'TODOS'
        || (periodo === 'PROXIMOS_30' && inicio >= agora && inicio <= agora + limite)
        || (periodo === 'ULTIMOS_30' && inicio < agora && inicio >= agora - limite)
        || (periodo === 'PERSONALIZADO' && inicio >= inicioPersonalizado && inicio <= fimPersonalizado);
      const texto = `${partida.modalidade} ${partida.local} ${partida.categoria ?? ''}`.toLocaleLowerCase('pt-BR');
      const categoriaPartida = partida.categoria ?? 'Todas as categorias';
      const diaDaPartida = String(new Date(partida.inicio).getDay());
      return (!termo || texto.includes(termo)) && (status === 'TODOS' || partida.status === status)
        && (categoria === 'TODAS' || categoriaPartida === categoria) && (diaSemana === 'TODOS' || diaDaPartida === diaSemana)
        && correspondePeriodo;
    }).sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  }, [buscaAplicada, status, categoria, diaSemana, periodo, dataInicial, dataFinal, partidas.data]);
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / itensPorPagina));
  const partidasDaPagina = filtradas.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);
  const partidasDoDia = (partidas.data ?? [])
    .filter((partida) => dataLocal(new Date(partida.inicio)) === diaCalendario)
    .sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());

  useEffect(() => { setPagina(1); }, [buscaAplicada, status, categoria, diaSemana, periodo, dataInicial, dataFinal]);
  useEffect(() => { if (pagina > totalPaginas) setPagina(totalPaginas); }, [pagina, totalPaginas]);

  const intervaloInvalido = periodo === 'PERSONALIZADO' && dataInicial !== '' && dataFinal !== '' && dataInicial > dataFinal;
  const quantidadeFiltros = Number(status !== 'TODOS') + Number(categoria !== 'TODAS') + Number(diaSemana !== 'TODOS') + Number(periodo !== 'TODOS');
  const filtrosAtivos = buscaAplicada.trim() !== '' || quantidadeFiltros > 0;

  function limparFiltros() {
    setBusca('');
    setBuscaAplicada('');
    setStatus('TODOS');
    setCategoria('TODAS');
    setDiaSemana('TODOS');
    setPeriodo('TODOS');
    setDataInicial('');
    setDataFinal('');
  }

  function abrir(partida: Partida) {
    navigate(`/admin/partidas/${partida.id}`);
  }

  return (
    <section className="admin-card admin-users-page" aria-labelledby="titulo-partidas-admin">
      <header className="admin-card-header"><div><h1 id="titulo-partidas-admin">{visualizacao === 'calendario' ? 'Calendário de partidas' : 'Partidas'}</h1><p>{visualizacao === 'calendario' ? 'Visualize as partidas por dia, horário e local.' : 'Crie partidas e acompanhe os jogadores inscritos.'}</p></div><div className="admin-card-header-actions"><div className="admin-view-switch" role="group" aria-label="Modo de visualização"><button type="button" className={visualizacao === 'calendario' ? 'active' : ''} aria-label="Visualizar em calendário" aria-pressed={visualizacao === 'calendario'} onClick={() => navigate('/admin/partidas/calendario')}><CalendarDays aria-hidden="true" /></button><button type="button" className={visualizacao === 'lista' ? 'active' : ''} aria-label="Visualizar em lista" aria-pressed={visualizacao === 'lista'} onClick={() => navigate('/admin/partidas')}><List aria-hidden="true" /></button></div><button type="button" className="admin-button admin-button-secondary" disabled={partidas.isFetching} onClick={() => void partidas.refetch()}>Atualizar</button><button type="button" className="admin-button admin-button-primary" onClick={() => navigate('/admin/partidas/nova')}><Plus aria-hidden="true" />Nova partida</button></div></header>
      <div className="admin-users-panel">
        {visualizacao === 'lista' && <><div className="admin-users-toolbar admin-table-toolbar admin-match-filter-toolbar"><label className="admin-users-search"><span className="sr-only">Buscar partidas</span><div><Search aria-hidden="true" /><input type="search" value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Buscar modalidade, categoria ou local..." /></div></label><div className="admin-match-filter-actions"><button type="button" className={`admin-user-filter-trigger ${filtrosAbertos ? 'active' : ''}`} aria-expanded={filtrosAbertos} onClick={() => setFiltrosAbertos((abertos) => !abertos)}><Funnel aria-hidden="true" />Filtros{quantidadeFiltros > 0 && <span>{quantidadeFiltros}</span>}</button>{quantidadeFiltros > 0 && <button type="button" className="admin-user-clear-filters" onClick={limparFiltros}><RotateCcw aria-hidden="true" />Limpar</button>}</div></div>
        {filtrosAbertos && <div className="admin-match-filter-panel"><label><span>Status</span><select value={status} onChange={(evento) => setStatus(evento.target.value as StatusPartida | 'TODOS')}><option value="TODOS">Todos os status</option>{Object.entries(rotulosStatus).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}</select></label><label><span>Categoria</span><select value={categoria} onChange={(evento) => setCategoria(evento.target.value)}><option value="TODAS">Todas as categorias</option>{categoriasDisponiveis.map((item) => <option key={item} value={item}>{item}</option>)}</select></label><label><span>Dia da semana</span><select value={diaSemana} onChange={(evento) => setDiaSemana(evento.target.value)}><option value="TODOS">Todos os dias</option><option value="1">Segunda-feira</option><option value="2">Terça-feira</option><option value="3">Quarta-feira</option><option value="4">Quinta-feira</option><option value="5">Sexta-feira</option><option value="6">Sábado</option><option value="0">Domingo</option></select></label><label><span>Período</span><select value={periodo} onChange={(evento) => setPeriodo(evento.target.value as typeof periodo)}><option value="PROXIMOS_30">Próximos 30 dias</option><option value="ULTIMOS_30">Últimos 30 dias</option><option value="PERSONALIZADO">Entre datas</option><option value="TODOS">Todo o período</option></select></label></div>}
        {periodo === 'PERSONALIZADO' && <div className="admin-date-range"><label><span>De</span><input type="date" value={dataInicial} max={dataFinal || undefined} onChange={(evento) => setDataInicial(evento.target.value)} /></label><label><span>Até</span><input type="date" value={dataFinal} min={dataInicial || undefined} onChange={(evento) => setDataFinal(evento.target.value)} /></label><button type="button" className="admin-button admin-button-secondary" onClick={() => { setDataInicial(''); setDataFinal(''); }}>Limpar datas</button></div>}
        {intervaloInvalido && <p className="admin-date-error" role="alert">A data inicial deve ser anterior ou igual à data final.</p>}
        {partidas.isSuccess && <div className="admin-filter-feedback admin-match-filter-feedback" role="status" aria-live="polite"><span>{busca !== buscaAplicada ? 'Filtrando…' : `${filtradas.length} ${filtradas.length === 1 ? 'partida encontrada' : 'partidas encontradas'}`}</span>{filtrosAtivos && <b>{quantidadeFiltros > 0 ? `${quantidadeFiltros} ${quantidadeFiltros === 1 ? 'filtro aplicado' : 'filtros aplicados'}` : 'Busca aplicada'}</b>}</div>}</>}
        {partidas.isError && <div className="admin-inline-error" role="alert"><span>{mensagemDeErro(partidas.error)}</span><button onClick={() => void partidas.refetch()}>Tentar novamente</button></div>}
        {partidas.isPending && <div className="admin-table-skeleton" aria-label="Carregando partidas"><span /><span /><span /><span /></div>}
        {partidas.isSuccess && visualizacao === 'lista' && filtradas.length === 0 && <div className="admin-empty-state"><h3>Nenhuma partida encontrada</h3><p>Ajuste a busca, o status ou o período selecionado.</p><button className="admin-button admin-button-secondary" onClick={limparFiltros}>Limpar filtros</button></div>}
        {partidas.isSuccess && visualizacao === 'calendario' && <CalendarioPartidas partidas={partidasDoDia} dia={diaCalendario} aoMudarDia={setDiaCalendario} aoAbrir={abrir} />}
        {filtradas.length > 0 && visualizacao === 'lista' && <><div className="admin-users-table-wrap"><table className="admin-users-table admin-matches-table"><thead><tr><th>Partida</th><th>Categoria</th><th>Dia da semana</th><th>Data e horário</th><th>Local</th><th>Capacidade</th><th>Status</th><th>Andamento</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{partidasDaPagina.map((partida) => <tr key={partida.id} onClick={() => abrir(partida)}><td><strong>{partida.modalidade}</strong></td><td>{partida.categoria ?? 'Todas as categorias'}</td><td className="admin-match-weekday">{formatoDiaSemana.format(new Date(partida.inicio))}</td><td>{formatoData.format(new Date(partida.inicio))}</td><td>{partida.local}</td><td>{partida.capacidade}</td><td><span className={`admin-badge admin-badge-${partida.status.toLowerCase()}`}>{rotulosStatus[partida.status]}</span></td><td><ResumoArbitragem partida={partida} /></td><td className="admin-user-action"><button type="button" aria-label={`Consultar partida de ${partida.modalidade}`} onClick={(evento) => { evento.stopPropagation(); abrir(partida); }}>›</button></td></tr>)}</tbody></table></div><Paginacao total={filtradas.length} rotuloSingular="partida" rotuloPlural="partidas" pagina={pagina} totalPaginas={totalPaginas} itensPorPagina={itensPorPagina} aoMudarPagina={setPagina} aoMudarItensPorPagina={(quantidade) => { setItensPorPagina(quantidade); setPagina(1); }} /></>}
      </div>
      {aviso && <AvisoTemporario mensagem={aviso} aoFechar={() => setAviso('')} />}
    </section>
  );
}

function CalendarioPartidas({ partidas, dia, aoMudarDia, aoAbrir }: { partidas: Partida[]; dia: string; aoMudarDia: (dia: string) => void; aoAbrir: (partida: Partida) => void }) {
  const seletorData = useRef<HTMLInputElement>(null);
  const locais = [...new Set(partidas.map((partida) => partida.local))];
  const horarios = [...new Set(partidas.map((partida) => horaDaPartida(partida)))].sort();
  const moverDia = (quantidade: number) => {
    const data = new Date(`${dia}T12:00:00`);
    data.setDate(data.getDate() + quantidade);
    aoMudarDia(dataLocal(data));
  };

  return <section className="admin-booking-calendar" aria-label="Calendário de partidas">
    <header><button type="button" onClick={() => moverDia(-1)} aria-label="Dia anterior"><ChevronLeft aria-hidden="true" /></button><button type="button" className="admin-calendar-date" aria-label={`Selecionar data. Data atual: ${formatoDiaCalendario.format(new Date(`${dia}T12:00:00`))}`} onClick={() => seletorData.current?.showPicker()}><CalendarDays aria-hidden="true" /><strong>{formatoDiaCalendario.format(new Date(`${dia}T12:00:00`))}</strong></button><input ref={seletorData} className="admin-calendar-date-input" type="date" value={dia} aria-label="Selecionar data" tabIndex={-1} onChange={(evento) => aoMudarDia(evento.target.value)} /><button type="button" onClick={() => moverDia(1)} aria-label="Próximo dia"><ChevronRight aria-hidden="true" /></button></header>
    {partidas.length === 0 ? <div className="admin-calendar-empty"><CalendarDays aria-hidden="true" /><strong>Nenhuma partida neste dia</strong><span>Use as setas ou selecione outra data.</span></div> : <div className="admin-booking-grid" style={{ '--calendar-columns': locais.length } as CSSProperties}>
      <div className="admin-booking-corner">Horário</div>{locais.map((local) => <div className="admin-booking-location" key={local}>{local}</div>)}
      {horarios.map((horario) => <div className="admin-booking-row" key={horario}><div className="admin-booking-time">{horario}</div>{locais.map((local) => <div className="admin-booking-slot" key={local}>{partidas.filter((partida) => partida.local === local && horaDaPartida(partida) === horario).map((partida) => <button type="button" className={`admin-booking-card admin-booking-card-${partida.arbitragem.status.toLowerCase()}`} key={partida.id} onClick={() => aoAbrir(partida)}><span>{partida.modalidade}</span><strong>{partida.categoria ?? 'Todas as categorias'}</strong><small>{partida.quantidadeInscritos ?? 0} de {partida.capacidade} inscritos</small><ResumoArbitragem partida={partida} /></button>)}</div>)}</div>)}
    </div>}
  </section>;
}

function ResumoArbitragem({ partida }: { partida: Partida }) {
  const arbitragem = partida.arbitragem;
  return <span className={`admin-match-state admin-match-state-${arbitragem.status.toLowerCase()}`}>{rotulosArbitragem[arbitragem.status]}</span>;
}

function dataLocal(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function horaDaPartida(partida: Partida) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(partida.inicio));
}
