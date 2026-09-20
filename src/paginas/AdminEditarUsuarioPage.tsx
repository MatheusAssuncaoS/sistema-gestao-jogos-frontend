import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { adminUsuarioService } from '../servicos/adminUsuarioService';
import { ApiError } from '../servicos/api';
import type { Papel, StatusUsuario, UsuarioResumo } from '../servicos/tipos';
import { validarEmail } from '../validacao/cadastro';
import { StatusBadge } from '../componentes/ui/StatusBadge';
import { Confirmacao } from '../componentes/ui/Confirmacao';
import { AvisoTemporario } from '../componentes/ui/AvisoTemporario';
import { DialogSenhaUsuario } from '../componentes/admin/DialogSenhaUsuario';

const rotulosStatus: Record<StatusUsuario, string> = { PENDENTE: 'Pendente', ATIVO: 'Ativo', BLOQUEADO: 'Bloqueado', INATIVO: 'Inativo', RECUSADO: 'Recusado' };
const rotulosPapel: Record<Papel, string> = { JOGADOR: 'Jogador', ORGANIZADOR: 'Organizador', ARBITRO: 'Árbitro', ADMINISTRADOR: 'Administrador' };
const papeisDeFuncionario: Papel[] = ['ADMINISTRADOR', 'ORGANIZADOR', 'ARBITRO'];
const mensagemDeErro = (erro: unknown) => erro instanceof ApiError ? erro.detail : 'Não foi possível concluir a operação. Tente novamente.';

export function AdminEditarUsuarioPage() {
  const { usuarioId } = useParams();
  const usuarios = useQuery({ queryKey: ['admin', 'usuarios'], queryFn: adminUsuarioService.listar });
  const usuario = usuarios.data?.find(item => item.id === usuarioId && papeisDeFuncionario.some(papel => item.papeis.includes(papel)));
  if (usuarios.isPending) return <div className="admin-table-skeleton" role="status" aria-label="Carregando usuário"><span /><span /><span /></div>;
  if (usuarios.isError) return <div className="admin-inline-error" role="alert"><span>{mensagemDeErro(usuarios.error)}</span><button onClick={() => void usuarios.refetch()}>Tentar novamente</button></div>;
  if (!usuario) return <div className="admin-empty-state"><h3>Funcionário não encontrado</h3><p>Contas exclusivas de jogadores são gerenciadas na tela Jogadores.</p><Link to="/admin/seguranca/usuarios" className="admin-button admin-button-secondary">Voltar aos usuários</Link></div>;
  return <FormularioUsuario key={usuario.id} usuario={usuario} />;
}

function FormularioUsuario({ usuario }: { usuario: UsuarioResumo }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const voltar = () => navigate('/admin/seguranca/usuarios');
  const [selecionado, setSelecionado] = useState(usuario);
  const [nome, setNome] = useState(usuario.nome);
  const [email, setEmail] = useState(usuario.email);
  const [aviso, setAviso] = useState<string | null>(null);
  const [senhaAberta, setSenhaAberta] = useState(false);
  const alterarPapel = useMutation({
    mutationFn: ({ usuario, conceder, papel }: { usuario: UsuarioResumo; conceder: boolean; papel: 'ORGANIZADOR' | 'ARBITRO' }) => papel === 'ARBITRO' ? (conceder ? adminUsuarioService.concederArbitro(usuario.id) : adminUsuarioService.revogarArbitro(usuario.id)) : (conceder ? adminUsuarioService.concederOrganizador(usuario.id) : adminUsuarioService.revogarOrganizador(usuario.id)),
    onSuccess: (atualizado, variaveis) => {
      queryClient.setQueryData<UsuarioResumo[]>(['admin', 'usuarios'], (lista = []) => lista.map((item) => item.id === atualizado.id ? atualizado : item));
      if (!papeisDeFuncionario.some(papel => atualizado.papeis.includes(papel))) {
        voltar();
        return;
      }
      setSelecionado(atualizado);
      const perfil = variaveis.papel === 'ARBITRO' ? 'árbitro' : 'organizador';
      setAviso(variaveis.conceder ? `${atualizado.nome} agora é ${perfil}.` : `O perfil de ${perfil} foi removido de ${atualizado.nome}.`);
    },
  });
  const atualizarUsuario = useMutation({
    mutationFn: () => adminUsuarioService.atualizar(selecionado!.id, { nome: nome.trim(), email: email.trim(), versao: selecionado!.versao }),
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
    setSelecionado(atualizado);
    setNome(atualizado.nome);
    setEmail(atualizado.email);
    setAviso(mensagem);
  }

  function salvarUsuario(evento: FormEvent) {
    evento.preventDefault();
    if (!processando && nome.trim() && !validarEmail(email.trim())) atualizarUsuario.mutate();
  }

  function atualizarSelecionado(conceder: boolean, papel: 'ORGANIZADOR' | 'ARBITRO' = 'ORGANIZADOR') {
    if (selecionado) alterarPapel.mutate({ usuario: selecionado, conceder, papel });
  }

  const processando = atualizarUsuario.isPending || alterarStatus.isPending || alterarPapel.isPending || excluirUsuario.isPending;
  const alterado = nome.trim() !== selecionado.nome || email.trim() !== selecionado.email;
  return <section className="admin-create-match" aria-labelledby="titulo-editar-usuario">
    <header className="admin-create-heading"><div><button type="button" aria-label="Voltar" onClick={voltar} disabled={processando}><ArrowLeft /></button><div><h1 id="titulo-editar-usuario">Editar usuário</h1><p>Atualize os dados da conta e gerencie os acessos.</p></div></div><div><button type="button" className="admin-button admin-button-secondary" onClick={voltar} disabled={processando}>Cancelar</button><button type="submit" form="form-editar-usuario" className="admin-button admin-button-primary" disabled={processando || !alterado || !nome.trim() || Boolean(validarEmail(email.trim()))}>{atualizarUsuario.isPending ? 'Salvando…' : 'Salvar alterações'}</button></div></header>
    {aviso && <AvisoTemporario mensagem={aviso} aoFechar={() => setAviso(null)} />}
    <div className="admin-create-grid">
      <div className="admin-create-main">
        <section className="admin-form-card"><header><h2>Dados do usuário</h2><p>Dados utilizados para identificar e acessar a conta.</p></header><form id="form-editar-usuario" className="admin-form-fields admin-form-fields-two" onSubmit={salvarUsuario}>
          <label>Nome completo<input required maxLength={150} autoComplete="name" value={nome} onChange={evento => setNome(evento.target.value)} disabled={processando} /></label>
          <label>E-mail<input required type="email" maxLength={200} autoComplete="email" value={email} onChange={evento => setEmail(evento.target.value)} disabled={processando} /></label>
          {atualizarUsuario.isError && <p className="admin-form-error admin-form-field-full" role="alert">{mensagemDeErro(atualizarUsuario.error)}</p>}
        </form></section>
        <section className="admin-form-card"><header><h2>Perfis de acesso</h2><p>Gerencie as permissões de trabalho deste usuário.</p></header><div className="admin-form-fields"><div className="admin-access-row"><div><strong>Organizador</strong><small>{selecionado.papeis.includes('ORGANIZADOR') ? 'Pode criar e gerenciar partidas' : 'Sem permissão para organizar'}</small></div>{selecionado.papeis.includes('ORGANIZADOR') ? <Confirmacao acionador={<button className="admin-button admin-button-danger">Remover</button>} titulo="Remover perfil de organizador?" descricao="O usuário perderá o acesso ao ambiente de Organização no próximo login." rotuloConfirmacao="Remover perfil" processando={alterarPapel.isPending} aoConfirmar={() => atualizarSelecionado(false)} /> : <button className="admin-button admin-button-secondary" disabled={processando || selecionado.status !== 'ATIVO'} onClick={() => atualizarSelecionado(true)}>Conceder</button>}</div><div className="admin-access-row"><div><strong>Árbitro</strong><small>{selecionado.papeis.includes('ARBITRO') ? 'Pode preparar e conduzir partidas' : 'Sem permissão para arbitrar'}</small></div>{selecionado.papeis.includes('ARBITRO') ? <Confirmacao acionador={<button className="admin-button admin-button-danger">Remover</button>} titulo="Remover perfil de árbitro?" descricao="O usuário perderá o acesso à Central do árbitro no próximo login." rotuloConfirmacao="Remover perfil" processando={alterarPapel.isPending} aoConfirmar={() => atualizarSelecionado(false, 'ARBITRO')} /> : <button className="admin-button admin-button-secondary" disabled={processando || selecionado.status !== 'ATIVO'} onClick={() => atualizarSelecionado(true, 'ARBITRO')}>Conceder</button>}</div>{alterarPapel.isError && <p className="admin-sheet-error" role="alert">{mensagemDeErro(alterarPapel.error)}</p>}<div className="admin-security-action"><div><strong>Senha do usuário</strong><small>Defina ou gere uma senha provisória.</small></div><button className="admin-button admin-button-secondary" disabled={processando} onClick={() => setSenhaAberta(true)}><KeyRound aria-hidden="true" />Redefinir senha</button></div></div></section>
      </div>
      <aside className="admin-create-side"><section className="admin-form-card"><header><h2>Resumo</h2></header><div className="admin-config-edit-summary"><strong>{nome.trim() || selecionado.nome}</strong><small>{email.trim() || selecionado.email}</small><StatusBadge status={selecionado.status} rotulo={rotulosStatus[selecionado.status]} /><span>{selecionado.papeis.filter(papel => papel !== 'JOGADOR').map(papel => rotulosPapel[papel]).join(', ')}</span></div></section>
        <section className="admin-form-card"><div className="admin-form-fields"><div className="admin-user-status-actions"><h3>Status da conta</h3><p>Status atual: <StatusBadge status={selecionado.status} rotulo={rotulosStatus[selecionado.status]} /></p><div>{selecionado.status !== 'ATIVO' && <button className="admin-button admin-button-secondary" disabled={alterarStatus.isPending} onClick={() => alterarStatus.mutate('ATIVO')}>Ativar</button>}{selecionado.status !== 'BLOQUEADO' && <Confirmacao acionador={<button className="admin-button admin-button-danger">Bloquear</button>} titulo="Bloquear usuário?" descricao="O usuário não poderá acessar a plataforma até ser reativado." rotuloConfirmacao="Bloquear usuário" processando={alterarStatus.isPending} aoConfirmar={() => alterarStatus.mutate('BLOQUEADO')} />}{selecionado.status !== 'INATIVO' && <Confirmacao acionador={<button className="admin-button admin-button-secondary">Inativar</button>} titulo="Inativar usuário?" descricao="O usuário perderá o acesso à plataforma até ser reativado." rotuloConfirmacao="Inativar usuário" processando={alterarStatus.isPending} aoConfirmar={() => alterarStatus.mutate('INATIVO')} />}</div>{alterarStatus.isError && <p className="admin-sheet-error" role="alert">{mensagemDeErro(alterarStatus.error)}</p>}</div><div className="admin-danger-zone"><h3>Excluir cadastro</h3><p>Remove permanentemente a conta. Esta ação não pode ser desfeita.</p><Confirmacao acionador={<button className="admin-button admin-button-danger">Excluir cadastro</button>} titulo="Excluir cadastro permanentemente?" descricao={`O cadastro de ${selecionado.nome} será removido. Esta ação não pode ser desfeita.`} rotuloConfirmacao="Excluir permanentemente" processando={excluirUsuario.isPending} aoConfirmar={() => excluirUsuario.mutate()} />{excluirUsuario.isError && <p className="admin-sheet-error" role="alert">{mensagemDeErro(excluirUsuario.error)}</p>}</div></div></section>
      </aside>
    </div>
    <DialogSenhaUsuario aberto={senhaAberta} aoAlterar={setSenhaAberta} usuario={selecionado} aoConcluir={() => setAviso(`Senha de ${selecionado.nome} redefinida.`)} />
  </section>;
}
