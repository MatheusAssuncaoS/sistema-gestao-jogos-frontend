import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminJogadorService } from '../servicos/adminJogadorService';
import { ApiError } from '../servicos/api';
import { suspensaoService, tipoSuspensaoService } from '../servicos/suspensaoService';
import { fimDoPeriodo } from '../utilitarios/periodoSuspensao';

const hojeNoClube = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });

export function AdminCriarSuspensaoPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const jogadores = useQuery({ queryKey: ['admin', 'jogadores', 'ativos'], queryFn: () => adminJogadorService.listarAtivos('') });
  const [jogadorId, setJogadorId] = useState('');
  const tipos = useQuery({ queryKey: ['configuracoes', 'tipos-suspensao'], queryFn: tipoSuspensaoService.listar });
  const [tipoId, setTipoId] = useState('');
  const [buscaJogador, setBuscaJogador] = useState('');
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [opcaoAtiva, setOpcaoAtiva] = useState(-1);
  const campoBusca = useRef<HTMLInputElement>(null);
  const listaJogadores = useRef<HTMLUListElement>(null);
  const [dias, setDias] = useState<number | null>(null);
  const [motivo, setMotivo] = useState('');
  const [inicio, setInicio] = useState(hojeNoClube);
  const [fim, setFim] = useState('');
  const voltar = () => navigate('/admin/suspensoes');
  const jogador = jogadores.data?.find(item => item.id === jogadorId);
  const tipo = tipos.data?.find(item => item.id === tipoId && item.ativo);
  const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
  const termo = normalizar(buscaJogador);
  const encontrados = (jogadores.data ?? []).filter(item => normalizar(item.nome).includes(termo) || normalizar(item.matriculaAssociado ?? '').includes(termo));
  const mostrarResultados = buscaAberta && !jogadorId && Boolean(termo);
  useEffect(() => {
    listaJogadores.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [opcaoAtiva]);
  const valido = Boolean(jogador && tipo && motivo.trim() && inicio && (!fim || fim >= inicio));
  function aplicarDias(quantidade: number) { setDias(quantidade); setFim(fimDoPeriodo(inicio, quantidade)); }
  function selecionarJogador(id: string) {
    const escolhido = jogadores.data?.find(item => item.id === id);
    setJogadorId(id);
    setBuscaJogador(escolhido ? `${escolhido.nome}${escolhido.matriculaAssociado ? ` · ${escolhido.matriculaAssociado}` : ''}` : '');
    setBuscaAberta(false);
    setOpcaoAtiva(-1);
  }
  const salvar = useMutation({
    mutationFn: () => suspensaoService.registrar({ jogadorId, tipoId, motivo: motivo.trim(), inicio, fim: fim || null }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'suspensoes'] });
      navigate('/admin/suspensoes', { replace: true, state: { aviso: 'Falta lançada com sucesso.' } });
    },
  });
  function submeter(evento: FormEvent) { evento.preventDefault(); if (valido && !salvar.isPending) salvar.mutate(); }

  return <section className="admin-create-match admin-create-suspension" aria-labelledby="titulo-criar-suspensao">
    <header className="admin-create-heading"><div><button type="button" aria-label="Voltar" onClick={voltar} disabled={salvar.isPending}><ArrowLeft /></button><div><h1 id="titulo-criar-suspensao">Registrar suspensão</h1><p>Informe o jogador, o motivo e o período da suspensão.</p></div></div><div><button type="button" className="admin-button admin-button-secondary" onClick={voltar} disabled={salvar.isPending}>Cancelar</button><button type="submit" form="form-criar-suspensao" className="admin-button admin-button-primary" disabled={!valido || salvar.isPending || !jogadores.isSuccess}>{salvar.isPending ? 'Registrando…' : 'Registrar suspensão'}</button></div></header>
    <form id="form-criar-suspensao" className="admin-create-grid" onSubmit={submeter}>
      <div className="admin-create-main">
        <section className="admin-form-card"><header><h2>Dados da suspensão</h2><p>Defina quem foi suspenso e a natureza do registro.</p></header><div className="admin-form-fields admin-form-fields-two">
          <div className="admin-form-field-full admin-player-combobox" onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setBuscaAberta(false); }}>
            <label htmlFor="busca-jogador-suspensao">Jogador</label>
            <div className="admin-player-search-input">
              <Search aria-hidden="true" />
              <input id="busca-jogador-suspensao" ref={campoBusca} autoFocus autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={mostrarResultados} aria-controls={mostrarResultados ? 'resultados-jogadores-suspensao' : undefined} aria-activedescendant={mostrarResultados && encontrados[opcaoAtiva] ? `opcao-jogador-${encontrados[opcaoAtiva].id}` : undefined} placeholder="Buscar por nome ou matrícula..." value={buscaJogador}
                onFocus={() => setBuscaAberta(true)}
                onChange={e => { setBuscaJogador(e.target.value); setJogadorId(''); setBuscaAberta(true); setOpcaoAtiva(-1); }}
                onKeyDown={e => {
                  if (e.key === 'Escape') { e.preventDefault(); setBuscaAberta(false); setOpcaoAtiva(-1); }
                  if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && termo && !jogadorId) {
                    e.preventDefault(); setBuscaAberta(true);
                    setOpcaoAtiva(atual => e.key === 'ArrowDown' ? Math.min(atual + 1, encontrados.length - 1) : Math.max(atual - 1, 0));
                  }
                  if (e.key === 'Enter' && !jogadorId) {
                    e.preventDefault();
                    if (mostrarResultados && encontrados[opcaoAtiva]) selecionarJogador(encontrados[opcaoAtiva].id);
                  }
                }} />
              {jogador && <Check className="admin-player-selected-check" aria-label="Jogador selecionado" />}
              {buscaJogador && <button type="button" title="Limpar jogador" aria-label="Limpar jogador" onClick={() => { selecionarJogador(''); campoBusca.current?.focus(); }}><X aria-hidden="true" /></button>}
            </div>
            {mostrarResultados && <div className="admin-player-suggestions">
              <ul id="resultados-jogadores-suspensao" ref={listaJogadores} role="listbox" aria-label="Jogadores encontrados" aria-busy={jogadores.isPending}>
                {encontrados.map((item, indice) => <li key={item.id} id={`opcao-jogador-${item.id}`} role="option" aria-selected={opcaoAtiva === indice} onMouseDown={e => e.preventDefault()} onClick={() => selecionarJogador(item.id)}>
                  <strong>{item.nome}</strong><span>{item.matriculaAssociado ? `Matrícula ${item.matriculaAssociado}` : 'Sem matrícula'} · {item.email}</span>
                </li>)}
              </ul>
              <p role="status">{jogadores.isPending ? 'Carregando jogadores...' : jogadores.isError ? 'Não foi possível carregar os jogadores.' : encontrados.length ? `${encontrados.length} ${encontrados.length === 1 ? 'jogador encontrado' : 'jogadores encontrados'}` : 'Nenhum jogador encontrado.'}</p>
            </div>}
          </div>
          <label className="admin-form-field-full">Tipo de suspensão<select required value={tipoId} disabled={tipos.isPending} onChange={e => { setTipoId(e.target.value); const escolhido = tipos.data?.find(item => item.id === e.target.value); if (escolhido) aplicarDias(escolhido.dias); }}><option value="">Selecione um tipo</option>{tipos.data?.filter(item => item.ativo).map(item => <option key={item.id} value={item.id}>{item.nome} · {item.dias} {item.dias === 1 ? 'dia' : 'dias'}</option>)}</select>{tipos.isSuccess && !tipos.data.some(item => item.ativo) && <span role="status">Nenhum tipo ativo cadastrado.</span>}</label>
          <label className="admin-form-field-full">Motivo<textarea required maxLength={500} rows={4} value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Descreva o motivo da suspensão" /><span>Obrigatório; até 500 caracteres.</span></label>
        </div></section>
        <section className="admin-form-card"><header><h2>Período</h2><p>O fim pode ficar em aberto. A data final, quando informada, está incluída no período.</p></header><div className="admin-form-fields admin-form-fields-two">
          <div className="admin-form-field-full admin-period-presets" role="group" aria-label="Duração da suspensão">{[...new Set([1, 5, 15, ...(tipo ? [tipo.dias] : [])])].sort((a, b) => a - b).map(quantidade => <button key={quantidade} type="button" className={`admin-button ${dias === quantidade ? 'admin-button-primary' : 'admin-button-secondary'}`} aria-pressed={dias === quantidade} onClick={() => aplicarDias(quantidade)}>{quantidade} {quantidade === 1 ? 'dia' : 'dias'}</button>)}</div>
          <label>Início<input required type="date" value={inicio} onChange={e => { setInicio(e.target.value); if (dias) setFim(fimDoPeriodo(e.target.value, dias)); }} /></label>
          <label>Fim (opcional)<input type="date" min={inicio} value={fim} onChange={e => { setFim(e.target.value); setDias(null); }} /></label>
        </div></section>
        {jogadores.isError && <p role="alert" className="admin-form-error">Não foi possível carregar os jogadores. <button type="button" onClick={() => void jogadores.refetch()}>Tentar novamente</button></p>}
        {tipos.isError && <p role="alert" className="admin-form-error">Não foi possível carregar os tipos. <button type="button" onClick={() => void tipos.refetch()}>Tentar novamente</button></p>}
        {salvar.isError && <p role="alert" className="admin-form-error">{salvar.error instanceof ApiError ? salvar.error.detail : 'Não foi possível registrar a suspensão.'}</p>}
      </div>
      <aside className="admin-create-side"><section className="admin-form-card"><header><h2>Resumo</h2></header><div className="admin-config-edit-summary"><strong>{jogador?.nome ?? 'Nenhum jogador selecionado'}</strong><small>{jogador?.matriculaAssociado ?? 'Sem matrícula'}</small><span>{tipo?.nome ?? 'Nenhum tipo selecionado'}</span><small>{fim ? `${inicio.split('-').reverse().join('/')} a ${fim.split('-').reverse().join('/')}` : 'Sem data de término.'}</small></div></section></aside>
    </form>
  </section>;
}
