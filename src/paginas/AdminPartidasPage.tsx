import { Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Sheet } from '../componentes/ui/Sheet';
import { Paginacao } from '../componentes/ui/Paginacao';
import { AvisoTemporario } from '../componentes/ui/AvisoTemporario';
import { CriarPartidaSheet } from '../componentes/admin/CriarPartidaSheet';
import { ApiError } from '../servicos/api';
import { organizadorPartidaService } from '../servicos/organizadorPartidaService';
import type { Partida, StatusInscricao, StatusPartida } from '../servicos/tipos';

const rotulosStatus: Record<StatusPartida, string> = { RASCUNHO: 'Rascunho', ABERTA: 'Aberta', LOTADA: 'Lotada', ENCERRADA: 'Encerrada', FINALIZADA: 'Finalizada', CANCELADA: 'Cancelada' };
const rotulosInscricao: Record<StatusInscricao, string> = { CONFIRMADA: 'Confirmada', LISTA_ESPERA: 'Lista de espera', CANCELADA: 'Cancelada', PRESENTE: 'Presente', AUSENTE: 'Ausente' };
const formatoData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function mensagemDeErro(falha: unknown) {
  return falha instanceof ApiError ? falha.detail : 'Não foi possível carregar as partidas. Tente novamente.';
}

export function AdminPartidasPage() {
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [status, setStatus] = useState<StatusPartida | 'TODOS'>('TODOS');
  const [periodo, setPeriodo] = useState<'PROXIMOS_30' | 'ULTIMOS_30' | 'PERSONALIZADO' | 'TODOS'>('PROXIMOS_30');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [selecionada, setSelecionada] = useState<Partida | null>(null);
  const [aba, setAba] = useState<'detalhes' | 'inscritos'>('detalhes');
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [criacaoAberta, setCriacaoAberta] = useState(false);
  const [aviso, setAviso] = useState('');
  const partidas = useQuery({ queryKey: ['partidas', 'gestao'], queryFn: organizadorPartidaService.listar });
  const inscritos = useQuery({ queryKey: ['partidas', selecionada?.id, 'inscritos'], queryFn: () => organizadorPartidaService.listarInscritos(selecionada!.id), enabled: selecionada !== null && aba === 'inscritos' });

  useEffect(() => {
    const temporizador = window.setTimeout(() => setBuscaAplicada(busca), 300);
    return () => window.clearTimeout(temporizador);
  }, [busca]);

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
      return (!termo || texto.includes(termo)) && (status === 'TODOS' || partida.status === status) && correspondePeriodo;
    }).sort((a, b) => new Date(a.inicio).getTime() - new Date(b.inicio).getTime());
  }, [buscaAplicada, status, periodo, dataInicial, dataFinal, partidas.data]);
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / itensPorPagina));
  const partidasDaPagina = filtradas.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);

  useEffect(() => { setPagina(1); }, [buscaAplicada, status, periodo, dataInicial, dataFinal]);
  useEffect(() => { if (pagina > totalPaginas) setPagina(totalPaginas); }, [pagina, totalPaginas]);

  const intervaloInvalido = periodo === 'PERSONALIZADO' && dataInicial !== '' && dataFinal !== '' && dataInicial > dataFinal;
  const filtrosAtivos = buscaAplicada.trim() !== '' || status !== 'TODOS' || periodo !== 'TODOS';

  function limparFiltros() {
    setBusca('');
    setBuscaAplicada('');
    setStatus('TODOS');
    setPeriodo('TODOS');
    setDataInicial('');
    setDataFinal('');
  }

  function abrir(partida: Partida) {
    setSelecionada(partida);
    setAba('detalhes');
  }

  return (
    <section className="admin-card admin-users-page" aria-labelledby="titulo-partidas-admin">
      <header className="admin-card-header"><div><h1 id="titulo-partidas-admin">Partidas</h1><p>Crie partidas e acompanhe os jogadores inscritos.</p></div><div className="admin-card-header-actions"><button type="button" className="admin-button admin-button-secondary" disabled={partidas.isFetching} onClick={() => void partidas.refetch()}>Atualizar</button><button type="button" className="admin-button admin-button-primary" onClick={() => setCriacaoAberta(true)}><Plus aria-hidden="true" />Nova partida</button></div></header>
      <div className="admin-users-panel">
        <div className="admin-users-toolbar admin-matches-toolbar"><label className="admin-users-search"><span>Buscar</span><div><input type="search" value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Modalidade, categoria ou local" /><Search aria-hidden="true" /></div></label><label className="admin-users-filter"><span>Status</span><select value={status} onChange={(evento) => setStatus(evento.target.value as StatusPartida | 'TODOS')}><option value="TODOS">Todos os status</option>{Object.entries(rotulosStatus).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}</select></label><label className="admin-users-filter"><span>Período</span><select value={periodo} onChange={(evento) => setPeriodo(evento.target.value as typeof periodo)}><option value="PROXIMOS_30">Próximos 30 dias</option><option value="ULTIMOS_30">Últimos 30 dias</option><option value="PERSONALIZADO">Entre datas</option><option value="TODOS">Todo o período</option></select></label></div>
        {periodo === 'PERSONALIZADO' && <div className="admin-date-range"><label><span>De</span><input type="date" value={dataInicial} max={dataFinal || undefined} onChange={(evento) => setDataInicial(evento.target.value)} /></label><label><span>Até</span><input type="date" value={dataFinal} min={dataInicial || undefined} onChange={(evento) => setDataFinal(evento.target.value)} /></label><button type="button" className="admin-button admin-button-secondary" onClick={() => { setDataInicial(''); setDataFinal(''); }}>Limpar datas</button></div>}
        {intervaloInvalido && <p className="admin-date-error" role="alert">A data inicial deve ser anterior ou igual à data final.</p>}
        {partidas.isSuccess && <div className="admin-filter-feedback" role="status" aria-live="polite"><span>{busca !== buscaAplicada ? 'Filtrando…' : `${filtradas.length} ${filtradas.length === 1 ? 'partida encontrada' : 'partidas encontradas'}`}</span>{filtrosAtivos && <><b>Filtros ativos</b><button type="button" onClick={limparFiltros}>Limpar filtros</button></>}</div>}
        {partidas.isError && <div className="admin-inline-error" role="alert"><span>{mensagemDeErro(partidas.error)}</span><button onClick={() => void partidas.refetch()}>Tentar novamente</button></div>}
        {partidas.isPending && <div className="admin-table-skeleton" aria-label="Carregando partidas"><span /><span /><span /><span /></div>}
        {partidas.isSuccess && filtradas.length === 0 && <div className="admin-empty-state"><h3>Nenhuma partida encontrada</h3><p>Ajuste a busca, o status ou o período selecionado.</p><button className="admin-button admin-button-secondary" onClick={limparFiltros}>Limpar filtros</button></div>}
        {filtradas.length > 0 && <><div className="admin-users-table-wrap"><table className="admin-users-table admin-matches-table"><thead><tr><th>Partida</th><th>Data e horário</th><th>Local</th><th>Capacidade</th><th>Status</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{partidasDaPagina.map((partida) => <tr key={partida.id} onClick={() => abrir(partida)}><td><strong>{partida.modalidade}</strong><small>{partida.categoria ?? 'Todas as categorias'}</small></td><td>{formatoData.format(new Date(partida.inicio))}</td><td>{partida.local}</td><td>{partida.capacidade}</td><td><span className={`admin-badge admin-badge-${partida.status.toLowerCase()}`}>{rotulosStatus[partida.status]}</span></td><td className="admin-user-action"><button type="button" aria-label={`Consultar partida de ${partida.modalidade}`} onClick={(evento) => { evento.stopPropagation(); abrir(partida); }}>›</button></td></tr>)}</tbody></table></div><Paginacao total={filtradas.length} rotuloSingular="partida" rotuloPlural="partidas" pagina={pagina} totalPaginas={totalPaginas} itensPorPagina={itensPorPagina} aoMudarPagina={setPagina} aoMudarItensPorPagina={(quantidade) => { setItensPorPagina(quantidade); setPagina(1); }} /></>}
      </div>

      <Sheet aberto={selecionada !== null} aoAlterar={(aberto) => { if (!aberto) setSelecionada(null); }} titulo={selecionada?.modalidade ?? 'Partida'} descricao={selecionada ? `${formatoData.format(new Date(selecionada.inicio))} · ${selecionada.local}` : undefined}>
        {selecionada && <><nav className="admin-sheet-tabs"><button className={aba === 'detalhes' ? 'active' : ''} onClick={() => setAba('detalhes')}>Detalhes</button><button className={aba === 'inscritos' ? 'active' : ''} onClick={() => setAba('inscritos')}>Inscritos</button></nav>
          {aba === 'detalhes' && <div className="admin-sheet-section"><dl><dt>Status</dt><dd><span className={`admin-badge admin-badge-${selecionada.status.toLowerCase()}`}>{rotulosStatus[selecionada.status]}</span></dd><dt>Modalidade</dt><dd>{selecionada.modalidade}</dd><dt>Categoria</dt><dd>{selecionada.categoria ?? 'Todas as categorias'}</dd><dt>Data e horário</dt><dd>{formatoData.format(new Date(selecionada.inicio))}</dd><dt>Local</dt><dd>{selecionada.local}</dd><dt>Capacidade</dt><dd>{selecionada.capacidade} jogadores</dd><dt>Inscrições</dt><dd>{periodoInscricoes(selecionada)}</dd></dl><p className="admin-readonly-note">Os dados da partida são somente para consulta no ambiente administrativo.</p></div>}
          {aba === 'inscritos' && <div className="admin-sheet-section">{inscritos.isPending && <div className="admin-table-skeleton"><span /><span /><span /></div>}{inscritos.isError && <div className="admin-inline-error"><span>{mensagemDeErro(inscritos.error)}</span><button onClick={() => void inscritos.refetch()}>Tentar novamente</button></div>}{inscritos.isSuccess && inscritos.data.length === 0 && <div className="admin-empty-state"><h3>Nenhum jogador inscrito</h3><p>As novas inscrições aparecerão aqui.</p></div>}{inscritos.data?.map((inscrito) => <article className="admin-participant" key={inscrito.inscricaoId}><span className="admin-participant-avatar">{iniciais(inscrito.nome)}</span><div><strong>{inscrito.nome}</strong><small>{inscrito.categoria ?? 'Categoria não informada'}</small></div><span className="admin-status">{rotulosInscricao[inscrito.status]}</span></article>)}</div>}
        </>}
      </Sheet>
      <CriarPartidaSheet aberto={criacaoAberta} aoAlterar={setCriacaoAberta} aoCriar={(partida) => { setAviso(`Partida de ${partida.modalidade} criada como rascunho.`); void partidas.refetch(); }} />
      {aviso && <AvisoTemporario mensagem={aviso} aoFechar={() => setAviso('')} />}
    </section>
  );
}

function iniciais(nome: string) {
  return nome.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
}

function periodoInscricoes(partida: Partida) {
  if (!partida.inscricoesAbremEm && !partida.inscricoesEncerramEm) return 'Período não informado';
  const inicio = partida.inscricoesAbremEm ? formatoData.format(new Date(partida.inscricoesAbremEm)) : 'início livre';
  const fim = partida.inscricoesEncerramEm ? formatoData.format(new Date(partida.inscricoesEncerramEm)) : 'sem encerramento';
  return `${inicio} até ${fim}`;
}
