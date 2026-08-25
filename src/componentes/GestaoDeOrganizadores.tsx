import * as Dialog from '@radix-ui/react-dialog';
import { ArrowDown, ArrowUp, ArrowUpDown, Funnel, KeyRound, RotateCcw, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminJogadorService } from '../servicos/adminJogadorService';
import { adminUsuarioService } from '../servicos/adminUsuarioService';
import { ApiError } from '../servicos/api';
import type { Papel, StatusUsuario, UsuarioResumo } from '../servicos/tipos';
import { validarSenha } from '../validacao/cadastro';
import { AvisoTemporario } from './ui/AvisoTemporario';
import { Confirmacao } from './ui/Confirmacao';
import { Paginacao } from './ui/Paginacao';
import { Sheet } from './ui/Sheet';

const rotulosStatus: Record<StatusUsuario, string> = { PENDENTE: 'Pendente', ATIVO: 'Ativo', BLOQUEADO: 'Bloqueado', INATIVO: 'Inativo', RECUSADO: 'Recusado' };
const rotulosPapel: Record<Papel, string> = { JOGADOR: 'Jogador', ORGANIZADOR: 'Organizador', ARBITRO: 'Árbitro', ADMINISTRADOR: 'Administrador' };
type CampoOrdenacao = 'usuario' | 'email' | 'perfis' | 'status';

function mensagemDeErro(falha: unknown) {
  if (falha instanceof ApiError) {
    if (falha.status === 409) return 'Este usuário foi atualizado por outro administrador. Atualize a lista.';
    return falha.detail;
  }
  return 'Não foi possível completar a operação. Tente novamente.';
}

function gerarSenha() {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const valores = new Uint32Array(10);
  crypto.getRandomValues(valores);
  return `Aa1!${Array.from(valores, (valor) => caracteres[valor % caracteres.length]).join('')}`;
}

export function GestaoDeUsuarios() {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState<StatusUsuario | 'TODOS'>('TODOS');
  const [papel, setPapel] = useState<Papel | 'TODOS'>('TODOS');
  const [selecionado, setSelecionado] = useState<UsuarioResumo | null>(null);
  const [aba, setAba] = useState<'resumo' | 'acesso'>('resumo');
  const [aviso, setAviso] = useState<string | null>(null);
  const [senhaAberta, setSenhaAberta] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [ordenacao, setOrdenacao] = useState<{ campo: CampoOrdenacao; direcao: 'asc' | 'desc' }>({ campo: 'usuario', direcao: 'asc' });

  const usuarios = useQuery({ queryKey: ['admin', 'usuarios'], queryFn: adminUsuarioService.listar });
  const alterarPapel = useMutation({
    mutationFn: ({ usuario, conceder, papel }: { usuario: UsuarioResumo; conceder: boolean; papel: 'ORGANIZADOR' | 'ARBITRO' }) => papel === 'ARBITRO' ? (conceder ? adminUsuarioService.concederArbitro(usuario.id) : adminUsuarioService.revogarArbitro(usuario.id)) : (conceder ? adminUsuarioService.concederOrganizador(usuario.id) : adminUsuarioService.revogarOrganizador(usuario.id)),
    onSuccess: (atualizado, variaveis) => {
      queryClient.setQueryData<UsuarioResumo[]>(['admin', 'usuarios'], (lista = []) => lista.map((item) => item.id === atualizado.id ? atualizado : item));
      setSelecionado(atualizado);
      const perfil = variaveis.papel === 'ARBITRO' ? 'árbitro' : 'organizador';
      setAviso(variaveis.conceder ? `${atualizado.nome} agora é ${perfil}.` : `O perfil de ${perfil} foi removido de ${atualizado.nome}.`);
    },
  });
  const atualizarUsuario = useMutation({
    mutationFn: () => adminUsuarioService.atualizar(selecionado!.id, { nome: nome.trim(), email: email.trim(), versao: selecionado!.versao }),
    onSuccess: (atualizado) => concluirAlteracao(atualizado, `Dados de ${atualizado.nome} atualizados.`),
    onError: (falha) => { if (falha instanceof ApiError && falha.status === 409) void usuarios.refetch(); },
  });
  const alterarStatus = useMutation({
    mutationFn: (novoStatus: 'ATIVO' | 'BLOQUEADO' | 'INATIVO') => adminUsuarioService.alterarStatus(selecionado!.id, { status: novoStatus, versao: selecionado!.versao }),
    onSuccess: (atualizado) => concluirAlteracao(atualizado, `Status de ${atualizado.nome} alterado para ${rotulosStatus[atualizado.status].toLowerCase()}.`),
    onError: (falha) => { if (falha instanceof ApiError && falha.status === 409) void usuarios.refetch(); },
  });
  const excluirUsuario = useMutation({
    mutationFn: () => adminUsuarioService.excluir(selecionado!.id, selecionado!.versao),
    onSuccess: () => {
      const nomeExcluido = selecionado!.nome;
      queryClient.setQueryData<UsuarioResumo[]>(['admin', 'usuarios'], (lista = []) => lista.filter((item) => item.id !== selecionado!.id));
      setSelecionado(null);
      setAviso(`Cadastro de ${nomeExcluido} excluído.`);
    },
    onError: (falha) => { if (falha instanceof ApiError && falha.status === 409) void usuarios.refetch(); },
  });

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return (usuarios.data ?? []).filter((usuario) => (!termo || usuario.nome.toLocaleLowerCase('pt-BR').includes(termo) || usuario.email.toLocaleLowerCase('pt-BR').includes(termo)) && (status === 'TODOS' || usuario.status === status) && (papel === 'TODOS' || usuario.papeis.includes(papel)));
  }, [busca, status, papel, usuarios.data]);
  const ordenados = useMemo(() => [...filtrados].sort((a, b) => {
    const valores: Record<CampoOrdenacao, [string, string]> = {
      usuario: [a.nome, b.nome],
      email: [a.email, b.email],
      perfis: [a.papeis.map((item) => rotulosPapel[item]).join(' '), b.papeis.map((item) => rotulosPapel[item]).join(' ')],
      status: [rotulosStatus[a.status], rotulosStatus[b.status]],
    };
    const comparacao = valores[ordenacao.campo][0].localeCompare(valores[ordenacao.campo][1], 'pt-BR', { sensitivity: 'base', numeric: true });
    return ordenacao.direcao === 'asc' ? comparacao : -comparacao;
  }), [filtrados, ordenacao]);
  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / itensPorPagina));
  const usuariosDaPagina = ordenados.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);

  useEffect(() => { setPagina(1); }, [busca, status, papel]);
  useEffect(() => { if (pagina > totalPaginas) setPagina(totalPaginas); }, [pagina, totalPaginas]);

  function abrir(usuario: UsuarioResumo) {
    setSelecionado(usuario);
    setNome(usuario.nome);
    setEmail(usuario.email);
    setAba('resumo');
    setAviso(null);
  }

  function concluirAlteracao(atualizado: UsuarioResumo, mensagem: string) {
    queryClient.setQueryData<UsuarioResumo[]>(['admin', 'usuarios'], (lista = []) => lista.map((item) => item.id === atualizado.id ? atualizado : item));
    setSelecionado(atualizado);
    setNome(atualizado.nome);
    setEmail(atualizado.email);
    setAviso(mensagem);
  }

  function salvarUsuario(evento: FormEvent) {
    evento.preventDefault();
    if (nome.trim() && email.trim()) atualizarUsuario.mutate();
  }

  function atualizarSelecionado(conceder: boolean, papel: 'ORGANIZADOR' | 'ARBITRO' = 'ORGANIZADOR') {
    if (selecionado) alterarPapel.mutate({ usuario: selecionado, conceder, papel });
  }

  function ordenarPor(campo: CampoOrdenacao) {
    setOrdenacao((atual) => ({ campo, direcao: atual.campo === campo && atual.direcao === 'asc' ? 'desc' : 'asc' }));
    setPagina(1);
  }

  return (
    <section className="admin-card admin-users-page admin-user-list-page" aria-labelledby="titulo-usuarios">
      <header className="admin-card-header"><div><h1 id="titulo-usuarios">Usuários</h1><p>Gerencie contas, perfis e permissões de acesso.</p></div><button type="button" onClick={() => void usuarios.refetch()} disabled={usuarios.isFetching} className="admin-button admin-button-secondary">Atualizar</button></header>
      <div className="admin-users-panel">
        <div className="admin-users-toolbar"><label className="admin-users-search"><span className="sr-only">Buscar usuários</span><div><Search aria-hidden="true" /><input type="search" value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Buscar por nome ou e-mail..." /></div></label><button type="button" className={`admin-user-filter-trigger ${filtrosAbertos ? 'active' : ''}`} aria-expanded={filtrosAbertos} onClick={() => setFiltrosAbertos((abertos) => !abertos)}><Funnel aria-hidden="true" />Filtros{(status !== 'TODOS' || papel !== 'TODOS') && <span>{Number(status !== 'TODOS') + Number(papel !== 'TODOS')}</span>}</button>{filtrosAbertos && <div className="admin-user-inline-filters"><label><span className="sr-only">Status</span><select value={status} onChange={(evento) => setStatus(evento.target.value as StatusUsuario | 'TODOS')}><option value="TODOS">Todos os status</option>{Object.entries(rotulosStatus).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}</select></label><label><span className="sr-only">Perfil</span><select value={papel} onChange={(evento) => setPapel(evento.target.value as Papel | 'TODOS')}><option value="TODOS">Todos os perfis</option>{Object.entries(rotulosPapel).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}</select></label></div>}{(status !== 'TODOS' || papel !== 'TODOS') && <button type="button" className="admin-user-clear-filters" onClick={() => { setStatus('TODOS'); setPapel('TODOS'); }}><RotateCcw aria-hidden="true" />Limpar filtros</button>}</div>
        {aviso && <AvisoTemporario mensagem={aviso} aoFechar={() => setAviso(null)} />}
        {usuarios.isError && <div className="admin-inline-error" role="alert"><span>{mensagemDeErro(usuarios.error)}</span><button onClick={() => void usuarios.refetch()}>Tentar novamente</button></div>}
        {usuarios.isPending && <div className="admin-table-skeleton" aria-label="Carregando usuários"><span /><span /><span /><span /></div>}
        {usuarios.isSuccess && filtrados.length === 0 && <div className="admin-empty-state"><h3>Nenhum usuário encontrado</h3><p>Ajuste a busca ou os filtros para encontrar uma conta.</p><button className="admin-button admin-button-secondary" onClick={() => { setBusca(''); setStatus('TODOS'); setPapel('TODOS'); }}>Limpar filtros</button></div>}
        {filtrados.length > 0 && <><div className="admin-users-table-wrap"><table className="admin-users-table"><thead><tr><CabecalhoOrdenavel rotulo="Usuário" campo="usuario" ordenacao={ordenacao} aoOrdenar={ordenarPor} /><CabecalhoOrdenavel rotulo="E-mail" campo="email" ordenacao={ordenacao} aoOrdenar={ordenarPor} /><CabecalhoOrdenavel rotulo="Perfis" campo="perfis" ordenacao={ordenacao} aoOrdenar={ordenarPor} /><CabecalhoOrdenavel rotulo="Status" campo="status" ordenacao={ordenacao} aoOrdenar={ordenarPor} /><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{usuariosDaPagina.map((usuario) => <tr key={usuario.id} onClick={() => abrir(usuario)}><td><strong>{usuario.nome}</strong></td><td className="admin-user-email">{usuario.email}</td><td>{usuario.papeis.map((item) => <span key={item} className="admin-user-role">{rotulosPapel[item]}</span>)}</td><td><span className={`admin-status admin-status-${usuario.status.toLowerCase()}`}>{rotulosStatus[usuario.status]}</span></td><td className="admin-user-action"><button type="button" onClick={(evento) => { evento.stopPropagation(); abrir(usuario); }} aria-label={`Gerenciar ${usuario.nome}`}>›</button></td></tr>)}</tbody></table></div><Paginacao total={filtrados.length} rotuloSingular="usuário" rotuloPlural="usuários" pagina={pagina} totalPaginas={totalPaginas} itensPorPagina={itensPorPagina} aoMudarPagina={setPagina} aoMudarItensPorPagina={(quantidade) => { setItensPorPagina(quantidade); setPagina(1); }} /></>}
      </div>

      <Sheet aberto={selecionado !== null} aoAlterar={(aberto) => { if (!aberto && !alterarPapel.isPending && !atualizarUsuario.isPending && !alterarStatus.isPending && !excluirUsuario.isPending) setSelecionado(null); }} titulo={selecionado?.nome ?? 'Usuário'} descricao={selecionado?.email}>
        {selecionado && <><nav className="admin-sheet-tabs"><button className={aba === 'resumo' ? 'active' : ''} onClick={() => setAba('resumo')}>Resumo</button><button className={aba === 'acesso' ? 'active' : ''} onClick={() => setAba('acesso')}>Acesso</button></nav>
          {aba === 'resumo' && <div className="admin-sheet-section"><form className="admin-sheet-form" onSubmit={salvarUsuario}><label>Nome completo<input value={nome} maxLength={150} required onChange={(evento) => setNome(evento.target.value)} /></label><label>E-mail<input type="email" value={email} maxLength={200} required onChange={(evento) => setEmail(evento.target.value)} /></label>{atualizarUsuario.isError && <p className="admin-sheet-error" role="alert">{mensagemDeErro(atualizarUsuario.error)}</p>}<div className="admin-sheet-actions"><button type="button" className="admin-button admin-button-secondary" disabled={nome === selecionado.nome && email === selecionado.email} onClick={() => { setNome(selecionado.nome); setEmail(selecionado.email); }}>Cancelar</button><button className="admin-button admin-button-primary" disabled={atualizarUsuario.isPending || !nome.trim() || !email.trim() || (nome === selecionado.nome && email === selecionado.email)}>{atualizarUsuario.isPending ? 'Salvando...' : 'Salvar alterações'}</button></div></form><div className="admin-user-status-actions"><h3>Status da conta</h3><p>Status atual: <span className={`admin-status admin-status-${selecionado.status.toLowerCase()}`}>{rotulosStatus[selecionado.status]}</span></p><div>{selecionado.status !== 'ATIVO' && <button className="admin-button admin-button-secondary" disabled={alterarStatus.isPending} onClick={() => alterarStatus.mutate('ATIVO')}>Ativar</button>}{selecionado.status !== 'BLOQUEADO' && <Confirmacao acionador={<button className="admin-button admin-button-danger">Bloquear</button>} titulo="Bloquear usuário?" descricao="O usuário não poderá acessar a plataforma até ser reativado." rotuloConfirmacao="Bloquear usuário" processando={alterarStatus.isPending} aoConfirmar={() => alterarStatus.mutate('BLOQUEADO')} />}{selecionado.status !== 'INATIVO' && <Confirmacao acionador={<button className="admin-button admin-button-secondary">Inativar</button>} titulo="Inativar usuário?" descricao="O usuário perderá o acesso à plataforma até ser reativado." rotuloConfirmacao="Inativar usuário" processando={alterarStatus.isPending} aoConfirmar={() => alterarStatus.mutate('INATIVO')} />}</div>{alterarStatus.isError && <p className="admin-sheet-error" role="alert">{mensagemDeErro(alterarStatus.error)}</p>}</div><div className="admin-danger-zone"><h3>Excluir cadastro</h3><p>Remove permanentemente a conta. Esta ação não pode ser desfeita.</p><Confirmacao acionador={<button className="admin-button admin-button-danger">Excluir cadastro</button>} titulo="Excluir cadastro permanentemente?" descricao={`O cadastro de ${selecionado.nome} será removido. Esta ação não pode ser desfeita.`} rotuloConfirmacao="Excluir permanentemente" processando={excluirUsuario.isPending} aoConfirmar={() => excluirUsuario.mutate()} />{excluirUsuario.isError && <p className="admin-sheet-error" role="alert">{mensagemDeErro(excluirUsuario.error)}</p>}</div></div>}
          {aba === 'acesso' && <div className="admin-sheet-section"><h3>Perfis de acesso</h3><div className="admin-access-row"><div><strong>Jogador</strong><small>{selecionado.papeis.includes('JOGADOR') ? 'Acesso liberado' : 'Sem perfil de jogador'}</small></div><span className="admin-status">{selecionado.papeis.includes('JOGADOR') ? 'Ativo' : 'Indisponível'}</span></div><div className="admin-access-row"><div><strong>Organizador</strong><small>{selecionado.papeis.includes('ORGANIZADOR') ? 'Pode criar e gerenciar partidas' : 'Sem permissão para organizar'}</small></div>{selecionado.papeis.includes('ORGANIZADOR') ? <Confirmacao acionador={<button className="admin-button admin-button-danger">Remover</button>} titulo="Remover perfil de organizador?" descricao="O usuário perderá o acesso ao ambiente de Organização no próximo login." rotuloConfirmacao="Remover perfil" processando={alterarPapel.isPending} aoConfirmar={() => atualizarSelecionado(false)} /> : <button className="admin-button admin-button-secondary" disabled={alterarPapel.isPending || selecionado.status !== 'ATIVO'} onClick={() => atualizarSelecionado(true)}>Conceder</button>}</div><div className="admin-access-row"><div><strong>Árbitro</strong><small>{selecionado.papeis.includes('ARBITRO') ? 'Pode preparar e conduzir partidas' : 'Sem permissão para arbitrar'}</small></div>{selecionado.papeis.includes('ARBITRO') ? <Confirmacao acionador={<button className="admin-button admin-button-danger">Remover</button>} titulo="Remover perfil de árbitro?" descricao="O usuário perderá o acesso à Central do árbitro no próximo login." rotuloConfirmacao="Remover perfil" processando={alterarPapel.isPending} aoConfirmar={() => atualizarSelecionado(false, 'ARBITRO')} /> : <button className="admin-button admin-button-secondary" disabled={alterarPapel.isPending || selecionado.status !== 'ATIVO'} onClick={() => atualizarSelecionado(true, 'ARBITRO')}>Conceder</button>}</div>{alterarPapel.isError && <p className="admin-sheet-error" role="alert">{mensagemDeErro(alterarPapel.error)}</p>}{selecionado.papeis.includes('JOGADOR') && selecionado.status === 'ATIVO' && <div className="admin-security-action"><div><strong>Senha do usuário</strong><small>Defina ou gere uma senha provisória.</small></div><button className="admin-button admin-button-secondary" onClick={() => setSenhaAberta(true)}><KeyRound aria-hidden="true" />Redefinir senha</button></div>}</div>}
        </>}
      </Sheet>
      {selecionado && <DialogSenha aberto={senhaAberta} aoAlterar={setSenhaAberta} usuario={selecionado} aoConcluir={() => setAviso(`Senha de ${selecionado.nome} redefinida.`)} />}
    </section>
  );
}

function CabecalhoOrdenavel({ rotulo, campo, ordenacao, aoOrdenar }: { rotulo: string; campo: CampoOrdenacao; ordenacao: { campo: CampoOrdenacao; direcao: 'asc' | 'desc' }; aoOrdenar: (campo: CampoOrdenacao) => void }) {
  const ativo = ordenacao.campo === campo;
  const Icone = !ativo ? ArrowUpDown : ordenacao.direcao === 'asc' ? ArrowUp : ArrowDown;
  return <th aria-sort={!ativo ? 'none' : ordenacao.direcao === 'asc' ? 'ascending' : 'descending'}><button type="button" className={ativo ? 'active' : ''} onClick={() => aoOrdenar(campo)}>{rotulo}<Icone aria-hidden="true" /></button></th>;
}

function DialogSenha({ aberto, aoAlterar, usuario, aoConcluir }: { aberto: boolean; aoAlterar: (aberto: boolean) => void; usuario: UsuarioResumo; aoConcluir: () => void }) {
  const [senha, setSenha] = useState('');
  const [exigirTroca, setExigirTroca] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function submeter(evento: FormEvent) {
    evento.preventDefault();
    const falhaValidacao = validarSenha(senha);
    if (falhaValidacao) { setErro(falhaValidacao); return; }
    setEnviando(true);
    setErro(null);
    try {
      await adminJogadorService.redefinirSenha(usuario.id, { novaSenha: senha, exigirTrocaNoProximoLogin: exigirTroca });
      aoConcluir();
      aoAlterar(false);
      setSenha('');
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  return <Dialog.Root open={aberto} onOpenChange={aoAlterar}><Dialog.Portal><Dialog.Overlay className="ui-dialog-overlay ui-dialog-overlay-nested" /><Dialog.Content className="ui-alert-content admin-password-dialog"><header><div><Dialog.Title>Redefinir senha</Dialog.Title><Dialog.Description>Configure uma nova senha para {usuario.nome}.</Dialog.Description></div><Dialog.Close className="ui-icon-button" aria-label="Fechar"><X /></Dialog.Close></header><form onSubmit={submeter}><label>Nova senha<div className="admin-password-field"><input value={senha} onChange={(evento) => { setSenha(evento.target.value); setErro(null); }} /><button type="button" className="admin-button admin-button-secondary" onClick={() => { setSenha(gerarSenha()); setErro(null); }}>Gerar</button></div></label>{erro && <p className="admin-sheet-error" role="alert">{erro}</p>}<label className="admin-checkbox"><input type="checkbox" checked={exigirTroca} onChange={(evento) => setExigirTroca(evento.target.checked)} />Exigir troca no próximo login</label><div className="ui-alert-actions"><Dialog.Close className="admin-button admin-button-secondary" disabled={enviando}>Cancelar</Dialog.Close><button className="admin-button admin-button-primary" disabled={enviando}>{enviando ? 'Redefinindo...' : 'Redefinir senha'}</button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
