import { PerfisDoUsuario } from '../componentes/admin/PerfisDoUsuario';
import { funcionario, nomesPerfis, pode } from '../seguranca/permissoes';
import { useAuth } from '../contexto/useAuth';
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImageUp, KeyRound, ShieldCheck, UserRound } from 'lucide-react';
import { adminUsuarioService } from '../servicos/adminUsuarioService';
import { ApiError } from '../servicos/api';
import type { StatusUsuario, UsuarioResumo } from '../servicos/tipos';
import { validarEmail } from '../validacao/cadastro';
import { StatusBadge } from '../componentes/ui/StatusBadge';
import { Confirmacao } from '../componentes/ui/Confirmacao';
import { AvisoTemporario } from '../componentes/ui/AvisoTemporario';
import { DialogSenhaUsuario } from '../componentes/admin/DialogSenhaUsuario';

const rotulosStatus: Record<StatusUsuario, string> = { PENDENTE: 'Pendente', ATIVO: 'Ativo', BLOQUEADO: 'Bloqueado', INATIVO: 'Inativo', RECUSADO: 'Recusado' };
const mensagemDeErro = (erro: unknown) => erro instanceof ApiError ? erro.detail : 'Não foi possível concluir a operação. Tente novamente.';

export function AdminEditarUsuarioPage() {
  const { usuarioId } = useParams();
  const location = useLocation();
  const editandoJogador = location.pathname.startsWith('/admin/usuarios/');
  const usuarios = useQuery({ queryKey: ['admin', 'usuarios'], queryFn: adminUsuarioService.listar });
  const usuario = usuarios.data?.find(item => item.id === usuarioId && (editandoJogador ? item.papeis.includes('JOGADOR') : funcionario(item)));
  if (usuarios.isPending) return <div className="admin-table-skeleton" role="status" aria-label="Carregando usuário"><span /><span /><span /></div>;
  if (usuarios.isError) return <div className="admin-inline-error" role="alert"><span>{mensagemDeErro(usuarios.error)}</span><button onClick={() => void usuarios.refetch()}>Tentar novamente</button></div>;
  if (!usuario) return <div className="admin-empty-state"><h3>{editandoJogador ? 'Jogador não encontrado' : 'Funcionário não encontrado'}</h3><p>O cadastro pode ter sido removido ou não está disponível.</p><Link to={editandoJogador ? '/admin/usuarios' : '/admin/seguranca/usuarios'} className="admin-button admin-button-secondary">Voltar</Link></div>;
  return <FormularioUsuario key={usuario.id} usuario={usuario} jogador={editandoJogador} />;
}

function FormularioUsuario({ usuario, jogador }: { usuario: UsuarioResumo; jogador: boolean }) {
  const navigate = useNavigate();
  const { usuario: operador } = useAuth();
  const queryClient = useQueryClient();
  const voltar = () => navigate(jogador ? '/admin/usuarios' : '/admin/seguranca/usuarios');
  const [selecionado, setSelecionado] = useState(usuario);
  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  const [fotoUrl, setFotoUrl] = useState<string | null>(usuario.fotoUrl ?? null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [senhaAberta, setSenhaAberta] = useState(false);
  const [aba, setAba] = useState<'perfil' | 'acessos' | 'senha' | 'conta'>(() => {
    const solicitada = new URLSearchParams(window.location.search).get('aba');
    return solicitada === 'acessos' || solicitada === 'senha' || solicitada === 'conta' ? solicitada : 'perfil';
  });
  const atualizarUsuario = useMutation({
    mutationFn: () => adminUsuarioService.atualizar(selecionado!.id, { nome: nome.trim(), email: email.trim(), fotoUrl: fotoUrl ?? '', versao: selecionado!.versao }),
    onSuccess: (atualizado) => concluirAlteracao(atualizado, `Dados de ${atualizado.nome} atualizados.`),
    onError: (falha) => { if (falha instanceof ApiError && falha.status === 409) void queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] }); },
  });
  const alterarStatus = useMutation({
    mutationFn: (novoStatus: 'ATIVO' | 'BLOQUEADO' | 'INATIVO') => adminUsuarioService.alterarStatus(selecionado!.id, { status: novoStatus, versao: selecionado!.versao }),
    onSuccess: (atualizado) => concluirAlteracao(atualizado, `Status de ${atualizado.nome} alterado para ${rotulosStatus[atualizado.status].toLowerCase()}.`),
    onError: (falha) => { if (falha instanceof ApiError && falha.status === 409) void queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] }); },
  });
  const excluirUsuario = useMutation({
    mutationFn: () => adminUsuarioService.excluir(selecionado!.id, selecionado!.versao),
    onSuccess: () => {
      const nomeExcluido = selecionado!.nome;
      queryClient.setQueryData<UsuarioResumo[]>(['admin', 'usuarios'], (lista = []) => lista.filter((item) => item.id !== selecionado!.id));
      voltar();
      setAviso(`Cadastro de ${nomeExcluido} excluído.`);
    },
    onError: (falha) => { if (falha instanceof ApiError && falha.status === 409) void queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] }); },
  });
  function concluirAlteracao(atualizado: UsuarioResumo, mensagem: string) {
    queryClient.setQueryData<UsuarioResumo[]>(['admin', 'usuarios'], (lista = []) => lista.map((item) => item.id === atualizado.id ? atualizado : item));
    void queryClient.invalidateQueries({ queryKey: ['admin', 'jogadores', 'ativos'] });
    setSelecionado(atualizado);
    setNome(atualizado.nome);
    setEmail(atualizado.email);
    setFotoUrl(atualizado.fotoUrl ?? null);
    setAviso(mensagem);
  }

  function salvarUsuario(evento: FormEvent) {
    evento.preventDefault();
    if (!processando && nome.trim() && !validarEmail(email.trim())) atualizarUsuario.mutate();
  }

  const processando = atualizarUsuario.isPending || alterarStatus.isPending || excluirUsuario.isPending;
  const alterado = nome.trim() !== selecionado.nome || email.trim() !== selecionado.email || fotoUrl !== (selecionado.fotoUrl ?? null);
  function selecionarFoto(arquivo?: File) {
    if (!arquivo) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(arquivo.type) || arquivo.size > 2_000_000) { setAviso('Escolha uma imagem PNG, JPG ou WebP de até 2 MB.'); return; }
    const leitor = new FileReader();
    leitor.onload = () => setFotoUrl(String(leitor.result));
    leitor.readAsDataURL(arquivo);
  }
  return <section className="admin-create-match admin-user-edit" aria-labelledby="titulo-editar-usuario">
    <header className="admin-create-heading"><div><button type="button" aria-label="Voltar" onClick={voltar} disabled={processando}><ArrowLeft /></button><div><h1 id="titulo-editar-usuario">{jogador ? 'Editar jogador' : 'Editar usuário'}</h1><p>Atualize os dados da conta e gerencie os acessos.</p></div></div><div><button type="button" className="admin-button admin-button-secondary" onClick={voltar} disabled={processando}>Cancelar</button>{aba === 'perfil' && <button type="submit" form="form-editar-usuario" className="admin-button admin-button-primary" disabled={!pode(operador, 'USUARIOS_GERENCIAR') || processando || !alterado || !nome.trim() || Boolean(validarEmail(email.trim()))}>{atualizarUsuario.isPending ? 'Salvando…' : 'Salvar alterações'}</button>}</div></header>
    {aviso && <AvisoTemporario mensagem={aviso} aoFechar={() => setAviso(null)} />}
    <nav className="admin-user-tabs" aria-label="Seções da edição do usuário">
      <button type="button" className={aba === 'perfil' ? 'active' : ''} aria-current={aba === 'perfil' ? 'page' : undefined} onClick={() => setAba('perfil')}><UserRound aria-hidden="true" />Meu perfil</button>
      <button type="button" className={aba === 'acessos' ? 'active' : ''} aria-current={aba === 'acessos' ? 'page' : undefined} onClick={() => setAba('acessos')}><ShieldCheck aria-hidden="true" />Perfis de acesso</button>
      <button type="button" className={aba === 'senha' ? 'active' : ''} aria-current={aba === 'senha' ? 'page' : undefined} onClick={() => setAba('senha')}><KeyRound aria-hidden="true" />Senha</button>
      <button type="button" className={aba === 'conta' ? 'active' : ''} aria-current={aba === 'conta' ? 'page' : undefined} onClick={() => setAba('conta')}><ShieldCheck aria-hidden="true" />Conta</button>
    </nav>
    <div className="admin-create-grid">
      <div className="admin-create-main">
        {aba === 'perfil' && <section className="admin-form-card admin-profile-settings"><header><h2>{jogador ? 'Perfil do jogador' : 'Perfil do usuário'}</h2><p>Gerencie as informações pessoais e a foto da conta.</p></header><form id="form-editar-usuario" className="admin-form-fields admin-form-fields-two" onSubmit={salvarUsuario}>
          <div className="admin-profile-photo admin-form-field-full"><div>{fotoUrl ? <img src={fotoUrl} alt="Foto do usuário" /> : <UserRound aria-hidden="true" />}</div><label className="admin-button admin-button-secondary"><ImageUp aria-hidden="true" />Alterar foto<input type="file" accept="image/png,image/jpeg,image/webp" onChange={evento => selecionarFoto(evento.target.files?.[0])} /></label>{fotoUrl && <button type="button" className="admin-button admin-button-secondary" onClick={() => setFotoUrl(null)}>Remover</button>}<small>PNG, JPG ou WebP de até 2 MB.</small></div>
          <label>Nome completo<input required maxLength={150} autoComplete="name" value={nome} onChange={evento => setNome(evento.target.value)} disabled={processando || !pode(operador, 'USUARIOS_GERENCIAR')} /></label>
          <label>E-mail<input required type="email" maxLength={200} autoComplete="email" value={email} onChange={evento => setEmail(evento.target.value)} disabled={processando || !pode(operador, 'USUARIOS_GERENCIAR')} /></label>
          {atualizarUsuario.isError && <p className="admin-form-error admin-form-field-full" role="alert">{mensagemDeErro(atualizarUsuario.error)}</p>}
        </form></section>}
        {aba === 'acessos' && <section className="admin-form-card"><header><h2>Perfis de acesso</h2><p>Defina quais áreas do clube este usuário pode acessar.</p></header><div className="admin-user-permissions"><PerfisDoUsuario key={`${selecionado.id}-${selecionado.versao}`} usuario={selecionado} aoSalvar={atualizado => concluirAlteracao(atualizado, 'Perfis atualizados.')} /></div></section>}
        {aba === 'senha' && <section className="admin-form-card"><header><h2>Segurança</h2><p>Atualize as credenciais de acesso à conta.</p></header><div className="admin-user-security"><div><strong>Senha do usuário</strong><small>Defina ou gere uma senha provisória.</small></div><button type="button" className="admin-button admin-button-secondary" disabled={processando || !pode(operador, 'USUARIOS_SENHA')} onClick={() => setSenhaAberta(true)}><KeyRound aria-hidden="true" />Redefinir senha</button></div></section>}
        {aba === 'conta' && pode(operador, 'USUARIOS_GERENCIAR') && <><section className="admin-form-card"><header><h2>Status da conta</h2><p>Controle o acesso deste usuário à plataforma.</p></header><div className="admin-user-status-actions"><p>Status atual: <StatusBadge status={selecionado.status} rotulo={rotulosStatus[selecionado.status]} /></p><div>{selecionado.status !== 'ATIVO' && <button className="admin-button admin-button-secondary" disabled={alterarStatus.isPending} onClick={() => alterarStatus.mutate('ATIVO')}>Ativar</button>}{selecionado.status !== 'BLOQUEADO' && <Confirmacao acionador={<button className="admin-button admin-button-secondary">Bloquear</button>} titulo="Bloquear usuário?" descricao="O usuário não poderá acessar a plataforma até ser reativado." rotuloConfirmacao="Bloquear usuário" processando={alterarStatus.isPending} aoConfirmar={() => alterarStatus.mutate('BLOQUEADO')} />}{selecionado.status !== 'INATIVO' && <Confirmacao acionador={<button className="admin-button admin-button-secondary">Inativar</button>} titulo="Inativar usuário?" descricao="O usuário perderá o acesso à plataforma até ser reativado." rotuloConfirmacao="Inativar usuário" processando={alterarStatus.isPending} aoConfirmar={() => alterarStatus.mutate('INATIVO')} />}</div>{alterarStatus.isError && <p className="admin-sheet-error" role="alert">{mensagemDeErro(alterarStatus.error)}</p>}</div></section><section className="admin-form-card admin-user-danger-card"><header><h2>Excluir cadastro</h2><p>Remova a conta definitivamente.</p></header><div className="admin-user-danger-content"><p>Esta ação não pode ser desfeita.</p><Confirmacao acionador={<button className="admin-button admin-button-danger">Excluir cadastro</button>} titulo="Excluir cadastro permanentemente?" descricao={`O cadastro de ${selecionado.nome} será removido. Esta ação não pode ser desfeita.`} rotuloConfirmacao="Excluir permanentemente" processando={excluirUsuario.isPending} aoConfirmar={() => excluirUsuario.mutate()} />{excluirUsuario.isError && <p className="admin-sheet-error" role="alert">{mensagemDeErro(excluirUsuario.error)}</p>}</div></section></>}
      </div>
      <aside className="admin-create-side"><section className="admin-form-card"><header><h2>Resumo do usuário</h2></header><div className="admin-user-summary"><div className="admin-user-summary-avatar">{fotoUrl ? <img src={fotoUrl} alt="" /> : <UserRound aria-hidden="true" />}</div><div><strong>{nome.trim() || selecionado.nome}</strong><small>{email.trim() || selecionado.email}</small></div><StatusBadge status={selecionado.status} rotulo={rotulosStatus[selecionado.status]} /><span>{nomesPerfis(selecionado).join(', ') || 'Sem perfil atribuído'}</span></div></section>

      </aside>
    </div>
    <DialogSenhaUsuario aberto={senhaAberta} aoAlterar={setSenhaAberta} usuario={selecionado} aoConcluir={() => setAviso(`Senha de ${selecionado.nome} redefinida.`)} />
  </section>;
}
