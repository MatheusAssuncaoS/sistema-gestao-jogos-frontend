import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminJogadorService } from '../servicos/adminJogadorService';
import { ApiError } from '../servicos/api';
import type { SituacaoAssociativa } from '../servicos/tipos';
import { validarCadastro } from '../validacao/cadastro';

export function AdminCriarJogadorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const categorias = useQuery({ queryKey: ['admin', 'jogadores', 'categorias'], queryFn: adminJogadorService.listarCategorias });
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [matricula, setMatricula] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [situacao, setSituacao] = useState<SituacaoAssociativa>('REGULAR');
  const [erros, setErros] = useState<Record<string, string>>({});
  const voltar = () => navigate('/admin/usuarios');
  const salvar = useMutation({
    mutationFn: () => adminJogadorService.criar({ nome: nome.trim(), email: email.trim(), senha, matriculaAssociado: matricula.trim() || undefined, categoriaId: Number(categoriaId), situacaoAssociativa: situacao }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'jogadores', 'ativos'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] }),
      ]);
      voltar();
    },
  });
  function submeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const validacao = validarCadastro({ nome, email: email.trim(), senha, confirmacao });
    if (!categoriaId) validacao.categoriaId = 'Selecione uma categoria.';
    setErros(validacao);
    if (!Object.keys(validacao).length) salvar.mutate();
  }
  return <section className="admin-create-match" aria-labelledby="titulo-criar-jogador">
    <header className="admin-create-heading"><div><button type="button" aria-label="Voltar" onClick={voltar} disabled={salvar.isPending}><ArrowLeft /></button><div><h1 id="titulo-criar-jogador">Novo jogador</h1><p>Cadastre a conta e os dados esportivos do jogador.</p></div></div><div><button type="button" className="admin-button admin-button-secondary" onClick={voltar} disabled={salvar.isPending}>Cancelar</button><button type="submit" form="form-criar-jogador" className="admin-button admin-button-primary" disabled={salvar.isPending || !categorias.isSuccess}>{salvar.isPending ? 'Cadastrando…' : 'Cadastrar jogador'}</button></div></header>
    <form id="form-criar-jogador" className="admin-create-main" onSubmit={submeter}>
      <section className="admin-form-card"><header><h2>Dados pessoais</h2><p>Dados usados para identificar e acessar a conta.</p></header><div className="admin-form-fields admin-form-fields-two">
        <label>Nome completo<input required maxLength={150} autoComplete="name" value={nome} onChange={e => setNome(e.target.value)} aria-invalid={Boolean(erros.nome)} />{erros.nome && <span className="admin-form-error">{erros.nome}</span>}</label>
        <label>E-mail<input required type="email" maxLength={200} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={Boolean(erros.email)} />{erros.email && <span className="admin-form-error">{erros.email}</span>}</label>
        <label>Senha provisória<input required type="password" minLength={8} maxLength={72} autoComplete="new-password" value={senha} onChange={e => setSenha(e.target.value)} aria-invalid={Boolean(erros.senha)} /><span className={erros.senha ? 'admin-form-error' : ''}>{erros.senha || 'De 8 a 72 caracteres, com maiúscula, minúscula, número e caractere especial.'}</span></label>
        <label>Confirmar senha<input required type="password" minLength={8} maxLength={72} autoComplete="new-password" value={confirmacao} onChange={e => setConfirmacao(e.target.value)} aria-invalid={Boolean(erros.confirmacao)} />{erros.confirmacao && <span className="admin-form-error">{erros.confirmacao}</span>}</label>
      </div></section>
      <section className="admin-form-card"><header><h2>Dados esportivos</h2><p>Defina a categoria e a situação associativa.</p></header><div className="admin-form-fields admin-form-fields-two">
        <label>Matrícula do associado<input maxLength={50} value={matricula} onChange={e => setMatricula(e.target.value)} /><span>Opcional</span></label>
        <label>Categoria<select required value={categoriaId} onChange={e => setCategoriaId(e.target.value)} aria-invalid={Boolean(erros.categoriaId)}><option value="">Selecione uma categoria</option>{categorias.data?.map(categoria => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}</select>{erros.categoriaId && <span className="admin-form-error">{erros.categoriaId}</span>}</label>
        <label>Situação associativa<select value={situacao} onChange={e => setSituacao(e.target.value as SituacaoAssociativa)}><option value="REGULAR">Regular</option><option value="IRREGULAR">Irregular</option><option value="PENDENTE">Pendente</option></select></label>
      </div>{categorias.isError && <p role="alert" className="admin-form-error">Não foi possível carregar as categorias. <button type="button" onClick={() => void categorias.refetch()}>Tentar novamente</button></p>}</section>
      {salvar.isError && <p role="alert" className="admin-form-error">{salvar.error instanceof ApiError ? salvar.error.detail : 'Não foi possível cadastrar o jogador. Tente novamente.'}</p>}
    </form>
  </section>;
}
