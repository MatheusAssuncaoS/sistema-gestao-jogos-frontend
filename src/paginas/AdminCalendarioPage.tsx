import { useAuth } from '../contexto/useAuth';
import { pode } from '../seguranca/permissoes';
import { ArrowLeft, CalendarDays, ChevronRight, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '../servicos/api';
import { calendarioService, type ExcecaoCalendario } from '../servicos/calendarioService';
import { AvisoTemporario } from '../componentes/ui/AvisoTemporario';
import { Confirmacao } from '../componentes/ui/Confirmacao';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Paginacao } from '../componentes/ui/Paginacao';
import { CampoData } from '../componentes/ui/CampoData';
import { StatusBadge } from '../componentes/ui/StatusBadge';

const tipos: Record<ExcecaoCalendario['tipo'], string> = { FERIADO: 'Feriado', RECESSO: 'Recesso / emenda', BLOQUEIO: 'Manutenção / outro bloqueio' };
const formatar = new Intl.DateTimeFormat('pt-BR');
const mensagem = (erro: Error) => erro instanceof ApiError ? erro.detail : 'Não foi possível concluir a operação. Tente novamente.';

export function AdminCalendarioPage() {
  const { usuario: operador } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { bloqueioId } = useParams();
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const voltar = () => navigate('/admin/configuracoes/calendario');
  const [aviso, setAviso] = useState('');
  const [busca, setBusca] = useState('');
  const [localFiltro, setLocalFiltro] = useState('TODOS');
  const [statusFiltro, setStatusFiltro] = useState('TODOS');
  const [excEditando, setExcEditando] = useState<ExcecaoCalendario | null>(null);
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<ExcecaoCalendario['tipo']>('FERIADO');
  const [localId, setLocalId] = useState('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const excecoes = useQuery({ queryKey: ['configuracoes', 'calendario', 'excecoes'], queryFn: calendarioService.listarExcecoes });
  const locais = useQuery({ queryKey: ['configuracoes', 'calendario', 'locais'], queryFn: calendarioService.listarLocaisParaBloqueio });
  async function atualizar(texto: string) {
    setAviso(texto);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['configuracoes', 'calendario'] }),
      queryClient.invalidateQueries({ queryKey: ['calendario'] }),
    ]);
  }
  const salvarExc = useMutation({
    mutationFn: () => {
      const dados = { descricao: descricao.trim(), tipo, inicio, fim, localId: localId || null };
      return excEditando ? calendarioService.editarExcecao(excEditando.id, dados) : calendarioService.criarExcecao(dados);
    },
    onSuccess: () => { voltar(); return atualizar('Bloqueio salvo no calendário.'); },
  });
  const excluirExc = useMutation({
    mutationFn: () => calendarioService.excluirExcecao(excEditando!.id),
    onSuccess: () => { voltar(); return atualizar('Bloqueio inativado e mantido no histórico.'); },
  });
  const filtradas = useMemo(() => (excecoes.data ?? []).filter(e => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return `${e.descricao} ${tipos[e.tipo]} ${e.local ?? 'Clube inteiro'}`.toLocaleLowerCase('pt-BR').includes(termo)
      && (localFiltro === 'TODOS' || (localFiltro === 'GERAL' ? !e.localId : e.localId === localFiltro))
      && (statusFiltro === 'TODOS' || (statusFiltro === 'ATIVO' ? e.ativo : !e.ativo));
  }), [excecoes.data, busca, localFiltro, statusFiltro]);
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / itensPorPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const itensDaPagina = filtradas.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);
  useEffect(() => setPagina(1), [busca, localFiltro, statusFiltro, itensPorPagina]);
  const registro = excecoes.data?.find(e => e.id === bloqueioId);
  useEffect(() => {
    setExcEditando(registro ?? null); setDescricao(registro?.descricao ?? ''); setTipo(registro?.tipo ?? 'FERIADO');
    setLocalId(registro?.localId ?? ''); setInicio(registro?.inicio ?? ''); setFim(registro?.fim ?? '');
  }, [registro, bloqueioId]);
  function abrirExcecao(excecao?: ExcecaoCalendario) {
    salvarExc.reset(); excluirExc.reset();
    navigate(`/admin/configuracoes/calendario/${excecao?.id ?? 'novo'}`);
  }
  const excecaoValida = descricao.trim() && inicio && fim && fim >= inicio;
  if (bloqueioId) {
    if (bloqueioId !== 'novo' && excecoes.isPending) return <div className="admin-table-skeleton"><span /><span /><span /></div>;
    if (bloqueioId !== 'novo' && excecoes.isError) return <div className="admin-inline-error" role="alert">Não foi possível carregar o bloqueio.<button onClick={() => void excecoes.refetch()}>Tentar novamente</button></div>;
    if (bloqueioId !== 'novo' && (!registro || !registro.ativo)) return <div className="admin-empty-state"><h3>{registro ? 'Este bloqueio está inativo' : 'Bloqueio não encontrado'}</h3><Link to="/admin/configuracoes/calendario">Voltar aos bloqueios</Link></div>;
    return <section className="admin-create-match" aria-labelledby="titulo-bloqueio-form">
      <header className="admin-create-heading"><div><button type="button" aria-label="Voltar" onClick={voltar}><ArrowLeft /></button><div><h1 id="titulo-bloqueio-form">{bloqueioId === 'novo' ? 'Cadastrar bloqueio' : 'Editar bloqueio'}</h1><p>Defina o período e os locais afetados pelo bloqueio.</p></div></div></header>
      <div className="admin-create-grid"><div className="admin-create-main"><section className="admin-form-card"><header><h2>Dados do bloqueio</h2><p>As datas inicial e final são incluídas no bloqueio, durante o dia inteiro.</p></header>
      <form id="form-bloqueio" className="admin-form-fields admin-form-fields-two" onSubmit={(e: FormEvent) => { e.preventDefault(); if (excecaoValida) salvarExc.mutate(); }}>
        <label className="admin-form-field-full">Descrição<input required maxLength={150} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex.: manutenção do gramado" /></label>
        <label>Tipo<select value={tipo} onChange={e => setTipo(e.target.value as ExcecaoCalendario['tipo'])}>{Object.entries(tipos).map(([valor, nome]) => <option value={valor} key={valor}>{nome}</option>)}</select></label>
        <label>Abrangência<select value={localId} onChange={e => setLocalId(e.target.value)}><option value="">Clube inteiro — todos os locais</option>{locais.data?.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}</select></label>
        {locais.isPending && <p>Carregando locais…</p>}{locais.isError && <div role="alert">Não foi possível carregar os locais.<button type="button" onClick={() => void locais.refetch()}>Tentar novamente</button></div>}
        <CampoData titulo="Data inicial" valor={inicio} max={fim || undefined} aoAlterar={valor => { setInicio(valor); if (!fim) setFim(valor); }} />
        <CampoData titulo="Data final" valor={fim} min={inicio || undefined} aoAlterar={setFim} />
        <p className="admin-form-field-full">Partidas já cadastradas serão preservadas. Revise-as caso sejam afetadas por este bloqueio.</p>
        {salvarExc.isError && <p role="alert" className="admin-sheet-error">{mensagem(salvarExc.error)}</p>}
        <div className="admin-sheet-actions admin-form-field-full"><button type="button" className="admin-button admin-button-secondary" onClick={voltar}>Cancelar</button><button className="admin-button admin-button-primary" disabled={!pode(operador, 'CALENDARIO_GERENCIAR') || !excecaoValida || salvarExc.isPending || excluirExc.isPending || !locais.isSuccess || (Boolean(bloqueioId !== 'novo') && !registro?.ativo)}>{salvarExc.isPending ? 'Salvando…' : 'Salvar bloqueio'}</button></div>
      </form>
      {excEditando && pode(operador, 'CALENDARIO_GERENCIAR') && <div className="admin-danger-zone"><Confirmacao acionador={<button className="admin-button admin-button-danger">Inativar bloqueio</button>} titulo="Inativar este bloqueio?" descricao="O bloqueio deixará de valer. Os demais bloqueios continuarão sendo respeitados, e o registro permanecerá no histórico." rotuloConfirmacao="Inativar bloqueio" processando={excluirExc.isPending} aoConfirmar={() => excluirExc.mutate()} />{excluirExc.isError && <p role="alert">{mensagem(excluirExc.error)}</p>}</div>}
      </section></div><aside className="admin-create-side"><section className="admin-form-card"><header><h2>Resumo</h2></header><div className="admin-config-edit-summary"><strong>{descricao || 'Novo bloqueio'}</strong><span>{tipos[tipo]}</span><small>{locais.data?.find(local => local.id === localId)?.nome ?? 'Clube inteiro'}</small>{inicio && fim && <small>{formatar.format(new Date(`${inicio}T12:00`))} até {formatar.format(new Date(`${fim}T12:00`))}</small>}</div></section></aside></div>
    </section>;
  }
  return <section className="admin-card admin-users-page" aria-labelledby="titulo-calendario">
    <header className="admin-card-header"><div><h1 id="titulo-calendario">Bloqueios de Calendário</h1><p>Cadastre feriados, emendas e bloqueios para o clube inteiro ou para um local específico.</p></div><button disabled={!pode(operador, 'CALENDARIO_GERENCIAR')} className="admin-button admin-button-primary" onClick={() => abrirExcecao()}><Plus />Cadastrar bloqueio</button></header>
    <article className="admin-users-panel">
      <div className="admin-users-toolbar admin-table-toolbar"><label className="admin-users-search"><span className="sr-only">Buscar bloqueios</span><div><Search /><input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar descrição ou local…" /></div></label><label className="admin-local-filter">Abrangência<select value={localFiltro} onChange={e => setLocalFiltro(e.target.value)}><option value="TODOS">Todas as abrangências</option><option value="GERAL">Clube inteiro</option>{locais.data?.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}</select></label><label className="admin-local-filter">Status<select value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)}><option value="TODOS">Todo o histórico</option><option value="ATIVO">Ativos</option><option value="INATIVO">Inativos</option></select></label></div>
      {excecoes.isSuccess && <div className="admin-filter-feedback" role="status"><span>{filtradas.length} {filtradas.length === 1 ? 'registro encontrado' : 'registros encontrados'}</span>{(busca || localFiltro !== 'TODOS' || statusFiltro !== 'TODOS') && <b>Filtro aplicado</b>}</div>}
      {excecoes.isPending && <div className="admin-table-skeleton"><span /><span /><span /></div>}
      {excecoes.isError && <div className="admin-inline-error" role="alert">Não foi possível carregar os bloqueios.<button onClick={() => void excecoes.refetch()}>Tentar novamente</button></div>}
      {excecoes.isSuccess && filtradas.length === 0 && <div className="admin-empty-state"><CalendarDays /><h3>Nenhum bloqueio encontrado</h3><p>Cadastre um bloqueio ou ajuste os filtros.</p></div>}
      {filtradas.length > 0 && <div className="admin-users-table-wrap"><table className="admin-users-table admin-config-table"><thead><tr><th>Descrição</th><th>Abrangência</th><th>Período</th><th>Status</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{itensDaPagina.map(e => <tr key={e.id} onClick={() => { if (e.ativo) abrirExcecao(e); }}><td><strong>{e.descricao}</strong><small>{tipos[e.tipo]}</small></td><td>{e.local ?? 'Clube inteiro'}</td><td>{formatar.format(new Date(`${e.inicio}T12:00`))}<small>até {formatar.format(new Date(`${e.fim}T12:00`))}</small></td><td><StatusBadge status={e.ativo ? 'ATIVO' : 'INATIVO'} rotulo={e.ativo ? 'Ativo' : 'Inativo'} /></td><td className="admin-user-action">{e.ativo && <button type="button" onClick={evento => { evento.stopPropagation(); abrirExcecao(e); }} aria-label={`Editar ${e.descricao}`}><ChevronRight /></button>}</td></tr>)}</tbody></table></div>}
      {filtradas.length > 0 && <Paginacao total={filtradas.length} rotuloSingular="bloqueio" rotuloPlural="bloqueios" pagina={paginaAtual} totalPaginas={totalPaginas} itensPorPagina={itensPorPagina} aoMudarPagina={setPagina} aoMudarItensPorPagina={setItensPorPagina} />}
    </article>
    {aviso && <AvisoTemporario mensagem={aviso} aoFechar={() => setAviso('')} />}
  </section>;
}
