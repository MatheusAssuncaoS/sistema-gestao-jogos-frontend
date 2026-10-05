import { perfilAcessoService } from '../servicos/perfilAcessoService';
import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminUsuarioService } from '../servicos/adminUsuarioService';
import { ApiError } from '../servicos/api';
import { validarCadastro } from '../validacao/cadastro';
import { StatusBadge } from '../componentes/ui/StatusBadge';

export function AdminCriarUsuarioPage() {
  const navigate = useNavigate();
  const consultaPerfis = useQuery({ queryKey: ['admin', 'perfis'], queryFn: perfilAcessoService.listar });
  const perfis = (consultaPerfis.data ?? []).filter(p => p.ativo && p.codigo !== 'JOGADOR');
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [papeis, setPapeis] = useState<number[]>([]);
  const [erros, setErros] = useState<Record<string, string>>({});
  const voltar = () => navigate('/admin/seguranca/usuarios');
  const salvar = useMutation({
    mutationFn: () => adminUsuarioService.criar({ nome: nome.trim(), email: email.trim(), senha, perfilIds: papeis }),
    onSuccess: async () => {
      setSenha(''); setConfirmacao('');
      await queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] });
      voltar();
    },
  });
  function submeter(evento: FormEvent) {
    evento.preventDefault();
    if (salvar.isPending) return;
    const validacao = validarCadastro({ nome, email: email.trim(), senha, confirmacao });
    if (!papeis.length) validacao.papeis = 'Selecione ao menos um perfil de acesso.';
    setErros(validacao);
    if (!Object.keys(validacao).length) salvar.mutate();
  }
  return <section className="admin-create-match" aria-labelledby="titulo-criar-usuario">
    <header className="admin-create-heading"><div><button type="button" aria-label="Voltar" onClick={voltar}><ArrowLeft /></button><div><h1 id="titulo-criar-usuario">Cadastrar usuário</h1><p>Informe os dados da conta e os perfis de acesso.</p></div></div><div><button type="button" className="admin-button admin-button-secondary" onClick={voltar} disabled={salvar.isPending}>Cancelar</button><button type="submit" form="form-criar-usuario" className="admin-button admin-button-primary" disabled={salvar.isPending || !consultaPerfis.isSuccess}>{salvar.isPending ? 'Cadastrando…' : 'Cadastrar usuário'}</button></div></header>
    <form id="form-criar-usuario" className="admin-create-grid" onSubmit={submeter}>
      <div className="admin-create-main">
        <section className="admin-form-card"><header><h2>Dados do usuário</h2><p>Dados utilizados para identificar e acessar a conta.</p></header><div className="admin-form-fields admin-form-fields-two">
          <label>Nome<input autoFocus required maxLength={150} autoComplete="name" value={nome} onChange={e => setNome(e.target.value)} aria-invalid={Boolean(erros.nome)} aria-describedby={erros.nome ? 'erro-nome' : undefined} />{erros.nome && <span id="erro-nome" className="admin-form-error">{erros.nome}</span>}</label>
          <label>E-mail<input required type="email" maxLength={200} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={Boolean(erros.email)} aria-describedby={erros.email ? 'erro-email' : undefined} />{erros.email && <span id="erro-email" className="admin-form-error">{erros.email}</span>}</label>
        </div></section>
        <section className="admin-form-card"><header><h2>Senha inicial</h2><p>O usuário deverá trocar a senha no primeiro acesso.</p></header><div className="admin-form-fields admin-form-fields-two">
          <label>Senha provisória<input required type="password" minLength={8} maxLength={72} autoComplete="new-password" value={senha} onChange={e => setSenha(e.target.value)} aria-invalid={Boolean(erros.senha)} aria-describedby="ajuda-senha" /><span id="ajuda-senha" className={erros.senha ? 'admin-form-error' : ''}>{erros.senha || 'De 8 a 72 caracteres, com maiúscula, minúscula, número e caractere especial.'}</span></label>
          <label>Confirmar senha<input required type="password" minLength={8} maxLength={72} autoComplete="new-password" value={confirmacao} onChange={e => setConfirmacao(e.target.value)} aria-invalid={Boolean(erros.confirmacao)} aria-describedby={erros.confirmacao ? 'erro-confirmacao' : undefined} />{erros.confirmacao && <span id="erro-confirmacao" className="admin-form-error">{erros.confirmacao}</span>}</label>
        </div></section>
        <section className="admin-form-card"><header><h2>Perfis de acesso</h2><p>Selecione os perfis administrativos desta conta. O perfil de jogador é concedido em Solicitações, com os dados do associado.</p></header><div className="admin-form-fields"><fieldset className="admin-local-modalidades"><legend>Perfis</legend>{consultaPerfis.isPending && <p role="status">Carregando perfis…</p>}{consultaPerfis.isError && <p role="alert">Não foi possível carregar os perfis. <button type="button" onClick={() => void consultaPerfis.refetch()}>Tentar novamente</button></p>}{perfis.map(perfil => <label key={perfil.id}><input type="checkbox" checked={papeis.includes(perfil.id)} onChange={e => setPapeis(e.target.checked ? [...papeis, perfil.id] : papeis.filter(papel => papel !== perfil.id))} />{perfil.nome}</label>)}{erros.papeis && <p className="admin-form-error" role="alert">{erros.papeis}</p>}</fieldset></div></section>
        {salvar.isError && <p role="alert" className="admin-form-error">{salvar.error instanceof ApiError ? salvar.error.detail : 'Não foi possível cadastrar o usuário. Tente novamente.'}</p>}
      </div>
      <aside className="admin-create-side"><section className="admin-form-card"><header><h2>Resumo</h2></header><div className="admin-config-edit-summary"><strong>{nome.trim() || 'Novo usuário'}</strong><small>{email.trim() || 'E-mail não informado'}</small><StatusBadge status="ATIVO" rotulo="Ativo" /><span>{perfis.filter(perfil => papeis.includes(perfil.id)).map(perfil => perfil.nome).join(', ') || 'Nenhum perfil selecionado'}</span><small>Troca de senha obrigatória no primeiro acesso.</small></div></section></aside>
    </form>
  </section>;
}
