import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Copy, Info, LockKeyhole, Search, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { StatusBadge } from '../componentes/ui/StatusBadge';
import { Confirmacao } from '../componentes/ui/Confirmacao';
import { useAuth } from '../contexto/useAuth';
import { alterarPermissao, pode } from '../seguranca/permissoes';
import { ApiError } from '../servicos/api';
import { perfilAcessoService, type PerfilAcesso, type PermissaoAcesso } from '../servicos/perfilAcessoService';
import './PerfisAcesso.css';

export function AdminPerfilFormPage() {
  const { perfilId } = useParams();
  const [params] = useSearchParams();
  const consulta = useQuery({ queryKey: ['admin', 'perfis'], queryFn: perfilAcessoService.listar });
  const catalogo = useQuery({ queryKey: ['admin', 'permissoes'], queryFn: perfilAcessoService.permissoes });
  const novo = !perfilId;
  const perfil = consulta.data?.find(p => p.id === Number(perfilId));
  if (consulta.isPending || catalogo.isPending) return <div className="admin-table-skeleton" role="status" aria-label="Carregando perfil"><span /><span /><span /></div>;
  if (consulta.isError || catalogo.isError) return <div className="admin-inline-error" role="alert"><span>Não foi possível carregar o perfil e suas permissões.</span><button onClick={() => { void consulta.refetch(); void catalogo.refetch(); }}>Tentar novamente</button></div>;
  if (!novo && !perfil) return <div className="admin-empty-state"><h1>Perfil não encontrado</h1><Link to="/admin/seguranca/perfis">Voltar aos perfis</Link></div>;
  const modelo = consulta.data.find(p => p.id === Number(params.get('modelo')) && p.codigo !== 'JOGADOR');
  return <FormularioPerfil key={`${perfilId ?? 'novo'}-${modelo?.id ?? ''}`} perfil={perfil} modelo={modelo} perfis={consulta.data} catalogo={catalogo.data} />;
}

function FormularioPerfil({ perfil, modelo, perfis, catalogo }: { perfil?: PerfilAcesso; modelo?: PerfilAcesso; perfis: PerfilAcesso[]; catalogo: PermissaoAcesso[] }) {
  const { usuario, recarregarUsuario } = useAuth();
  const navigate = useNavigate();
  const client = useQueryClient();
  const somenteLeitura = Boolean(perfil?.sistema) || !pode(usuario, 'PERFIS_GERENCIAR');
  const [nome, setNome] = useState(perfil?.nome ?? (modelo ? `${modelo.nome} — cópia` : ''));
  const [descricao, setDescricao] = useState(perfil?.descricao ?? modelo?.descricao ?? '');
  const [ativo, setAtivo] = useState(perfil?.ativo ?? true);
  const [permissoes, setPermissoes] = useState(perfil?.permissoes ?? modelo?.permissoes ?? []);
  const [modeloId, setModeloId] = useState(String(modelo?.id ?? ''));
  const [busca, setBusca] = useState('');
  const [erro, setErro] = useState('');
  const podeConceder = (p: PermissaoAcesso) => p.personalizavel && (usuario?.papeis.includes('ADMINISTRADOR') || pode(usuario, p.codigo));
  const visiveis = catalogo.filter(p => (somenteLeitura || p.personalizavel) && `${p.grupo} ${p.nome} ${p.descricao}`.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR')));
  const grupos = [...new Set(visiveis.map(p => p.grupo))];
  const voltar = () => navigate('/admin/seguranca/perfis');
  const salvar = useMutation({
    mutationFn: () => {
      const dados = { nome: nome.trim(), descricao: descricao.trim(), ativo, permissoes, versao: perfil?.versao };
      return perfil ? perfilAcessoService.atualizar(perfil.id, dados) : perfilAcessoService.criar(dados);
    },
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['admin'] });
      await recarregarUsuario();
      navigate('/admin/seguranca/perfis', { state: { aviso: perfil ? 'Perfil atualizado.' : 'Perfil cadastrado. Vincule-o aos usuários para conceder os acessos.' } });
    },
  });
  function submeter(e: FormEvent) {
    e.preventDefault();
    if (somenteLeitura || salvar.isPending) return;
    if (!nome.trim()) { setErro('Informe o nome do perfil.'); return; }
    if (perfis.some(p => p.id !== perfil?.id && p.nome.toLocaleLowerCase('pt-BR') === nome.trim().toLocaleLowerCase('pt-BR'))) { setErro('Já existe um perfil com este nome.'); return; }
    if (!permissoes.length) { setErro('Selecione ao menos uma permissão.'); return; }
    setErro(''); salvar.mutate();
  }
  function aplicarModelo() {
    const base = perfis.find(p => p.id === Number(modeloId));
    setPermissoes(base?.permissoes.filter(codigo => catalogo.some(p => p.codigo === codigo && podeConceder(p))) ?? []);
  }
  const titulo = perfil ? somenteLeitura ? 'Detalhes do perfil' : 'Editar perfil' : 'Cadastrar perfil';
  const gruposSelecionados = [...new Set(catalogo.filter(p => permissoes.includes(p.codigo)).map(p => p.grupo))];
  return <section className="admin-create-match perfil-form-page" aria-labelledby="titulo-perfil-form">
    <header className="admin-create-heading"><div><button type="button" aria-label="Voltar aos perfis" onClick={voltar} disabled={salvar.isPending}><ArrowLeft /></button><div><h1 id="titulo-perfil-form">{titulo}</h1><p>{somenteLeitura ? 'Consulte as áreas e ações disponíveis para este perfil.' : 'Defina a identificação do perfil e os acessos necessários.'}</p></div></div><div>{somenteLeitura ? pode(usuario, 'PERFIS_GERENCIAR') && perfil?.codigo !== 'JOGADOR' && <Link className="admin-button admin-button-primary" to={`/admin/seguranca/perfis/novo?modelo=${perfil?.id}`}><Copy />Usar como modelo</Link> : <><button type="button" className="admin-button admin-button-secondary" disabled={salvar.isPending} onClick={voltar}>Cancelar</button><button type="submit" form="form-perfil" className="admin-button admin-button-primary" disabled={salvar.isPending}>{salvar.isPending ? 'Salvando…' : perfil ? 'Salvar alterações' : 'Cadastrar perfil'}</button></>}</div></header>
    <form id="form-perfil" className="admin-create-grid" onSubmit={submeter}>
      <div className="admin-create-main">
        {perfil?.sistema && <div className="perfil-notice"><LockKeyhole aria-hidden="true" /><p><strong>Perfil protegido do sistema</strong><span>{perfil.codigo === 'JOGADOR' ? 'Concedido ao aprovar o cadastro do associado. As inscrições continuam sujeitas às regras de associação e disponibilidade.' : 'Seus acessos são mantidos pelo sistema. Crie uma cópia para definir um conjunto diferente de permissões.'}</span></p></div>}
        <section className="admin-form-card"><header><h2>Dados do perfil</h2><p>Use um nome que represente a função exercida no clube.</p></header><div className="admin-form-fields admin-form-fields-two">
          <label>Nome do perfil<input autoFocus={!somenteLeitura} required maxLength={80} value={nome} onChange={e => setNome(e.target.value)} disabled={somenteLeitura || salvar.isPending} placeholder="Ex.: Atendimento do clube" /></label>
          <label>Status<select value={ativo ? 'ATIVO' : 'INATIVO'} onChange={e => setAtivo(e.target.value === 'ATIVO')} disabled={somenteLeitura || salvar.isPending}><option value="ATIVO">Ativo</option><option value="INATIVO">Inativo</option></select><span>Perfis inativos não concedem acesso.</span></label>
          <label className="admin-form-field-full">Descrição<textarea rows={3} maxLength={255} value={descricao} onChange={e => setDescricao(e.target.value)} disabled={somenteLeitura || salvar.isPending} placeholder="Descreva a responsabilidade deste perfil." /><span>{descricao.length}/255 caracteres · Opcional</span></label>
        </div></section>
        <section className="admin-form-card"><header className="perfil-permissions-heading"><div><h2>Permissões de acesso</h2><p>Escolha o que o perfil pode consultar e executar em cada área.</p></div><span className="perfil-count">{permissoes.length} {permissoes.length === 1 ? 'selecionada' : 'selecionadas'}</span></header>
          {!somenteLeitura && <div className="perfil-template"><label>Começar com um modelo<select value={modeloId} onChange={e => setModeloId(e.target.value)} disabled={salvar.isPending}><option value="">Selecione um perfil</option>{perfis.filter(p => p.ativo && p.codigo !== 'JOGADOR' && p.id !== perfil?.id).map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label><Confirmacao acionador={<button type="button" className="admin-button admin-button-secondary" disabled={!modeloId || salvar.isPending}><Copy />Aplicar modelo</button>} titulo="Substituir as permissões selecionadas?" descricao="As permissões atuais serão substituídas pelas do modelo que você pode conceder. O nome e a descrição serão mantidos." rotuloConfirmacao="Aplicar modelo" aoConfirmar={aplicarModelo} /></div>}
          <div className="perfil-permission-search"><Search size={16} aria-hidden="true" /><input aria-label="Buscar permissão" type="search" placeholder="Buscar área ou permissão..." value={busca} onChange={e => setBusca(e.target.value)} /></div>
          <div className="perfil-permission-groups">{grupos.map(grupo => {
            const itens = visiveis.filter(p => p.grupo === grupo);
            const selecionados = itens.filter(p => permissoes.includes(p.codigo)).length;
            return <fieldset className="perfil-permission-group" key={grupo}><legend>{grupo}<span>{selecionados}/{itens.length}</span></legend><div className="perfil-permission-options">{itens.map(p => <label key={p.codigo} className={permissoes.includes(p.codigo) ? 'is-selected' : ''}><input type="checkbox" checked={permissoes.includes(p.codigo)} disabled={somenteLeitura || salvar.isPending || !podeConceder(p)} onChange={e => setPermissoes(atual => alterarPermissao(atual, p.codigo, e.target.checked, catalogo))} /><span><strong>{p.nome}</strong><small>{p.descricao}</small>{!somenteLeitura && !podeConceder(p) && <small>Seu usuário não pode conceder este acesso.</small>}</span></label>)}</div></fieldset>;
          })}{!grupos.length && <div className="admin-empty-state"><h3>Nenhuma permissão encontrada</h3><p>Tente buscar pelo nome de uma área.</p></div>}</div>
        </section>
        {(erro || salvar.isError) && <p role="alert" className="admin-form-error">{erro || (salvar.error instanceof ApiError ? salvar.error.detail : 'Não foi possível salvar o perfil. Tente novamente.')}</p>}
      </div>
      <aside className="admin-create-side"><section className="admin-form-card"><header><h2>Resumo do perfil</h2></header><div className="admin-config-edit-summary"><ShieldCheck className="perfil-summary-icon" /><strong>{nome.trim() || 'Novo perfil'}</strong><StatusBadge status={ativo ? 'ATIVO' : 'INATIVO'} rotulo={ativo ? 'Ativo' : 'Inativo'} /><span>{permissoes.length} {permissoes.length === 1 ? 'permissão' : 'permissões'} em {gruposSelecionados.length} {gruposSelecionados.length === 1 ? 'área' : 'áreas'}</span>{perfil && <small>{perfil.usuarios} usuários vinculados</small>}<div className="perfil-summary-tags">{gruposSelecionados.map(grupo => <span key={grupo}>{grupo}</span>)}</div>{!permissoes.length && <small>Selecione os acessos para compor o perfil.</small>}</div></section>
        <section className="admin-form-card"><header><h2>Como os acessos funcionam</h2></header><div className="perfil-rules"><p><Info size={16} aria-hidden="true" />Uma ação inclui a permissão de consulta da mesma área.</p><p>Usuários com vários perfis recebem a soma dos acessos dos perfis ativos.</p><p>{perfil ? 'Alterações valem nas próximas requisições dos usuários vinculados.' : 'Depois de cadastrar, vincule o perfil na edição de um usuário.'}</p>{!ativo && <p className="perfil-inactive-note">Este perfil não concederá acesso enquanto estiver inativo. Os vínculos serão preservados.</p>}</div></section>
      </aside>
    </form>
  </section>;
}
