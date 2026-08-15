import { Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

import { adminJogadorService } from '../servicos/adminJogadorService';
import { ApiError } from '../servicos/api';
import type { CadastroPendente, Categoria, SituacaoAssociativa } from '../servicos/tipos';
import { AvisoTemporario } from './ui/AvisoTemporario';
import { Confirmacao } from './ui/Confirmacao';
import { Paginacao } from './ui/Paginacao';
import { Sheet } from './ui/Sheet';

type Aba = 'pendentes' | 'recusados';
type Etapa = 'analise' | 'dados' | 'revisao';

const formatador = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function mensagemDeErro(falha: unknown) {
  if (falha instanceof ApiError) {
    if (falha.status === 401 || falha.status === 403) return 'Sua sessão expirou. Entre novamente.';
    if (falha.status === 409) return 'Este cadastro foi atualizado por outro administrador. Atualize a fila.';
    return falha.detail;
  }
  return 'Não foi possível completar a operação. Tente novamente.';
}

export function GestaoDeJogadores() {
  const queryClient = useQueryClient();
  const [parametros, setParametros] = useSearchParams();
  const [aba, setAba] = useState<Aba>('pendentes');
  const [cadastros, setCadastros] = useState<CadastroPendente[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [selecionado, setSelecionado] = useState<CadastroPendente | null>(null);
  const [etapa, setEtapa] = useState<Etapa>('analise');
  const [emAndamento, setEmAndamento] = useState(false);
  const [categoriaId, setCategoriaId] = useState<number | ''>('');
  const [situacao, setSituacao] = useState<SituacaoAssociativa>('REGULAR');
  const [matricula, setMatricula] = useState('');
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [lista, categoriasAtivas] = await Promise.all([
        aba === 'pendentes' ? adminJogadorService.listarPendentes() : adminJogadorService.listarRecusados(),
        adminJogadorService.listarCategorias(),
      ]);
      setCadastros(lista);
      setCategorias(categoriasAtivas);
      setCategoriaId((atual) => atual || categoriasAtivas[0]?.id || '');
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregando(false);
    }
  }, [aba]);

  useEffect(() => { void carregar(); }, [carregar]);
  useEffect(() => {
    const usuarioId = parametros.get('usuario');
    const cadastro = cadastros.find((item) => item.usuarioId === usuarioId);
    if (cadastro) {
      setSelecionado(cadastro);
      setEtapa('analise');
      setParametros({}, { replace: true });
    }
  }, [cadastros, parametros, setParametros]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return cadastros.filter((cadastro) => !termo || cadastro.nome.toLocaleLowerCase('pt-BR').includes(termo) || cadastro.email.toLocaleLowerCase('pt-BR').includes(termo));
  }, [busca, cadastros]);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / itensPorPagina));
  const cadastrosDaPagina = filtrados.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);
  useEffect(() => { setPagina(1); }, [busca, aba]);
  useEffect(() => { if (pagina > totalPaginas) setPagina(totalPaginas); }, [pagina, totalPaginas]);

  function abrir(cadastro: CadastroPendente) {
    setSelecionado(cadastro);
    setEtapa('analise');
    setMatricula('');
    setSituacao('REGULAR');
    setCategoriaId(categorias[0]?.id ?? '');
  }

  async function aprovar() {
    if (!selecionado || categoriaId === '') return;
    setEmAndamento(true);
    setErro(null);
    try {
      await adminJogadorService.aprovar(selecionado.usuarioId, { categoriaId: Number(categoriaId), situacaoAssociativa: situacao, matriculaAssociado: matricula || undefined });
      setCadastros((lista) => lista.filter((item) => item.usuarioId !== selecionado.usuarioId));
      void queryClient.invalidateQueries({ queryKey: ['admin', 'jogadores', 'pendentes'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
      setAviso(`Cadastro de ${selecionado.nome} aprovado.`);
      setSelecionado(null);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEmAndamento(false);
    }
  }

  async function recusar(cadastro: CadastroPendente) {
    setEmAndamento(true);
    setErro(null);
    try {
      await adminJogadorService.recusar(cadastro.usuarioId);
      setCadastros((lista) => lista.filter((item) => item.usuarioId !== cadastro.usuarioId));
      void queryClient.invalidateQueries({ queryKey: ['admin', 'jogadores', 'pendentes'] });
      setAviso(`Cadastro de ${cadastro.nome} recusado.`);
      setSelecionado(null);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEmAndamento(false);
    }
  }

  async function reabrir(cadastro: CadastroPendente) {
    setEmAndamento(true);
    setErro(null);
    try {
      await adminJogadorService.reabrir(cadastro.usuarioId);
      setCadastros((lista) => lista.filter((item) => item.usuarioId !== cadastro.usuarioId));
      void queryClient.invalidateQueries({ queryKey: ['admin', 'jogadores', 'pendentes'] });
      setAviso(`Cadastro de ${cadastro.nome} voltou para a fila de análise.`);
      setSelecionado(null);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEmAndamento(false);
    }
  }

  function revisar(evento: FormEvent) {
    evento.preventDefault();
    if (categoriaId !== '') setEtapa('revisao');
  }

  return (
    <section className="admin-card admin-users-page" aria-labelledby="titulo-cadastros">
      <header className="admin-card-header"><div><h1 id="titulo-cadastros">Cadastros</h1><p>Analise e acompanhe solicitações de novos jogadores.</p></div><button type="button" onClick={() => void carregar()} disabled={carregando} className="admin-button admin-button-secondary">Atualizar</button></header>
      <div className="admin-users-panel">
        <div className="admin-tabs admin-registration-tabs"><button type="button" className={`admin-tab ${aba === 'pendentes' ? 'admin-tab-active' : ''}`} onClick={() => { setAba('pendentes'); setAviso(null); }}>Pendentes</button><button type="button" className={`admin-tab ${aba === 'recusados' ? 'admin-tab-active' : ''}`} onClick={() => { setAba('recusados'); setAviso(null); }}>Recusados</button></div>
        <div className="admin-users-toolbar"><label className="admin-users-search"><span>Buscar</span><div><input type="search" value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Nome ou e-mail" /><Search aria-hidden="true" /></div></label></div>
        {aviso && <AvisoTemporario mensagem={aviso} aoFechar={() => setAviso(null)} />}
        {erro && <div className="admin-inline-error" role="alert"><span>{erro}</span><button type="button" onClick={() => void carregar()}>Tentar novamente</button></div>}
        {carregando && <div className="admin-table-skeleton" aria-label="Carregando cadastros"><span /><span /><span /></div>}
        {!carregando && !erro && filtrados.length === 0 && <div className="admin-empty-state"><h3>{busca ? 'Nenhum cadastro encontrado' : aba === 'pendentes' ? 'Nenhum cadastro pendente' : 'Nenhum cadastro recusado'}</h3><p>{busca ? 'Tente buscar por outro nome ou e-mail.' : aba === 'pendentes' ? 'Novas solicitações aparecerão aqui.' : 'Cadastros recusados aparecerão aqui.'}</p>{busca && <button className="admin-button admin-button-secondary" onClick={() => setBusca('')}>Limpar busca</button>}</div>}
        {!carregando && filtrados.length > 0 && <><div className="admin-users-table-wrap"><table className="admin-users-table admin-registration-table"><thead><tr><th>Solicitante</th><th>Solicitado em</th><th>Status</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{cadastrosDaPagina.map((cadastro) => <tr key={cadastro.usuarioId} onClick={() => abrir(cadastro)}><td><strong>{cadastro.nome}</strong><small>{cadastro.email}</small></td><td>{formatador.format(new Date(cadastro.cadastradoEm))}</td><td><span className={`admin-status admin-status-${aba === 'pendentes' ? 'pendente' : 'recusado'}`}>{aba === 'pendentes' ? 'Aguardando' : 'Recusado'}</span></td><td className="admin-user-action"><button type="button" aria-label={`Analisar ${cadastro.nome}`} onClick={(evento) => { evento.stopPropagation(); abrir(cadastro); }}>›</button></td></tr>)}</tbody></table></div><Paginacao total={filtrados.length} rotuloSingular="cadastro" rotuloPlural="cadastros" pagina={pagina} totalPaginas={totalPaginas} itensPorPagina={itensPorPagina} aoMudarPagina={setPagina} aoMudarItensPorPagina={(quantidade) => { setItensPorPagina(quantidade); setPagina(1); }} /></>}
      </div>

      <Sheet aberto={selecionado !== null} aoAlterar={(aberto) => { if (!aberto && !emAndamento) setSelecionado(null); }} titulo={selecionado?.nome ?? 'Cadastro'} descricao={selecionado?.email}>
        {selecionado && aba === 'pendentes' && <div className="admin-approval-flow"><ol className="admin-stepper"><li className={etapa === 'analise' ? 'active' : ''}>1. Análise</li><li className={etapa === 'dados' ? 'active' : ''}>2. Dados</li><li className={etapa === 'revisao' ? 'active' : ''}>3. Revisão</li></ol>
          {etapa === 'analise' && <div className="admin-sheet-section"><h3>Dados enviados</h3><dl><dt>Nome completo</dt><dd>{selecionado.nome}</dd><dt>E-mail</dt><dd>{selecionado.email}</dd><dt>Solicitado em</dt><dd>{formatador.format(new Date(selecionado.cadastradoEm))}</dd></dl><div className="admin-sheet-actions"><Confirmacao acionador={<button type="button" className="admin-button admin-button-danger">Recusar cadastro</button>} titulo="Recusar cadastro?" descricao="O cadastro será movido para a lista de recusados. Nenhum motivo é necessário." rotuloConfirmacao="Recusar cadastro" processando={emAndamento} aoConfirmar={() => void recusar(selecionado)} /><button type="button" className="admin-button admin-button-primary" onClick={() => setEtapa('dados')}>Continuar aprovação</button></div></div>}
          {etapa === 'dados' && <form className="admin-sheet-section admin-sheet-form" onSubmit={revisar}><label>Categoria<select value={categoriaId} onChange={(evento) => setCategoriaId(Number(evento.target.value))} required>{categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}</select></label><label>Situação associativa<select value={situacao} onChange={(evento) => setSituacao(evento.target.value as SituacaoAssociativa)}><option value="REGULAR">Regular</option><option value="IRREGULAR">Irregular</option><option value="PENDENTE">Pendente</option></select></label><label>Matrícula <span>(opcional)</span><input value={matricula} onChange={(evento) => setMatricula(evento.target.value)} /></label><div className="admin-sheet-actions"><button type="button" className="admin-button admin-button-secondary" onClick={() => setEtapa('analise')}>Voltar</button><button type="submit" className="admin-button admin-button-primary">Revisar aprovação</button></div></form>}
          {etapa === 'revisao' && <div className="admin-sheet-section"><h3>Revise antes de aprovar</h3><dl><dt>Jogador</dt><dd>{selecionado.nome}</dd><dt>Categoria</dt><dd>{categorias.find((categoria) => categoria.id === Number(categoriaId))?.nome}</dd><dt>Situação</dt><dd>{situacao}</dd><dt>Matrícula</dt><dd>{matricula || 'Não informada'}</dd></dl>{erro && <p className="admin-sheet-error" role="alert">{erro}</p>}<div className="admin-sheet-actions"><button type="button" className="admin-button admin-button-secondary" disabled={emAndamento} onClick={() => setEtapa('dados')}>Voltar</button><button type="button" className="admin-button admin-button-primary" disabled={emAndamento} onClick={() => void aprovar()}>{emAndamento ? 'Aprovando...' : 'Aprovar cadastro'}</button></div></div>}
        </div>}
        {selecionado && aba === 'recusados' && <div className="admin-sheet-section"><h3>Cadastro recusado</h3><dl><dt>Nome completo</dt><dd>{selecionado.nome}</dd><dt>E-mail</dt><dd>{selecionado.email}</dd><dt>Solicitado em</dt><dd>{formatador.format(new Date(selecionado.cadastradoEm))}</dd></dl><div className="admin-sheet-actions"><button type="button" className="admin-button admin-button-primary" disabled={emAndamento} onClick={() => void reabrir(selecionado)}>{emAndamento ? 'Reabrindo...' : 'Voltar para pendentes'}</button></div></div>}
      </Sheet>
    </section>
  );
}
