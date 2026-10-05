import { useAuth } from '../contexto/useAuth';
import { pode } from '../seguranca/permissoes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Confirmacao } from '../componentes/ui/Confirmacao';
import { StatusBadge } from '../componentes/ui/StatusBadge';
import { adminConfiguracaoService } from '../servicos/adminConfiguracaoService';
import { ApiError } from '../servicos/api';

type Item = { id: string | number; nome: string; descricao?: string | null; peso?: number; ativo?: boolean; modalidadeIds?: string[] };
type TipoConfiguracao = 'modalidades' | 'locais' | 'categorias';
const dadosConfiguracao = {
  modalidades: { titulo: 'Modalidades', singular: 'modalidade', carregar: adminConfiguracaoService.listarModalidades },
  locais: { titulo: 'Locais', singular: 'local', carregar: adminConfiguracaoService.listarLocais },
  categorias: { titulo: 'Categorias', singular: 'categoria', carregar: adminConfiguracaoService.listarCategorias },
};

export function AdminConfiguracaoFormPage({ tipo }: { tipo: TipoConfiguracao }) {
  const { usuario: operador } = useAuth();
  const { itemId = 'novo' } = useParams();
  const novo = itemId === 'novo';
  const dados = dadosConfiguracao[tipo];
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const consulta = useQuery<Item[]>({ queryKey: ['configuracoes', tipo], queryFn: async () => dados.carregar() });
  const modalidades = useQuery({ queryKey: ['configuracoes', 'modalidades'], queryFn: adminConfiguracaoService.listarModalidades, enabled: tipo === 'locais' });
  const locais = useQuery({ queryKey: ['configuracoes', 'locais'], queryFn: adminConfiguracaoService.listarLocais, enabled: tipo === 'modalidades' });
  const item = novo ? undefined : consulta.data?.find(registro => String(registro.id) === itemId);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [peso, setPeso] = useState('1');
  const [ativo, setAtivo] = useState(true);
  const [modalidadeIds, setModalidadeIds] = useState<string[]>([]);
  useEffect(() => { if (item) { setNome(item.nome); setDescricao(item.descricao ?? ''); setPeso(String(item.peso ?? 1)); setAtivo(item.ativo !== false); setModalidadeIds(item.modalidadeIds ?? []); } }, [item]);
  const voltar = () => navigate(`/admin/configuracoes/${tipo}`);
  const concluir = async () => { await queryClient.invalidateQueries({ queryKey: ['configuracoes'] }); await queryClient.invalidateQueries({ queryKey: ['partidas'] }); voltar(); };
  const salvar = useMutation({ mutationFn: async () => {
    if (tipo === 'modalidades') return novo ? adminConfiguracaoService.criarModalidade(nome.trim(), ativo) : adminConfiguracaoService.editarModalidade(itemId, nome.trim(), ativo);
    if (tipo === 'locais') return novo ? adminConfiguracaoService.criarLocal(nome.trim(), descricao.trim() || undefined, modalidadeIds, ativo) : adminConfiguracaoService.editarLocal(itemId, nome.trim(), descricao.trim() || undefined, modalidadeIds, ativo);
    return novo ? adminConfiguracaoService.criarCategoria(nome.trim(), Number(peso)) : adminConfiguracaoService.editarCategoria(Number(itemId), nome.trim(), Number(peso));
  }, onSuccess: concluir });
  const excluir = useMutation({ mutationFn: async () => tipo === 'modalidades' ? adminConfiguracaoService.excluirModalidade(itemId) : tipo === 'locais' ? adminConfiguracaoService.excluirLocal(itemId) : adminConfiguracaoService.excluirCategoria(Number(itemId)), onSuccess: concluir });
  const valido = Boolean(nome.trim()) && (tipo !== 'locais' || modalidadeIds.length > 0) && (tipo !== 'categorias' || Number(peso) >= 1);
  const erroSalvar = salvar.error instanceof ApiError ? salvar.error.detail : salvar.isError ? `Não foi possível salvar a ${dados.singular}.` : '';
  const erroExcluir = excluir.error instanceof ApiError ? excluir.error.detail : excluir.isError ? `Não foi possível excluir a ${dados.singular}.` : '';
  function submeter(evento: FormEvent) { evento.preventDefault(); if (valido && pode(operador, 'CADASTROS_GERENCIAR')) salvar.mutate(); }
  if (consulta.isPending || (tipo === 'locais' && modalidades.isPending)) return <div className="admin-table-skeleton"><span /><span /><span /></div>;
  if (!novo && consulta.isSuccess && !item) return <div className="admin-empty-state"><h3>Registro não encontrado</h3><Link className="admin-button admin-button-secondary" to={`/admin/configuracoes/${tipo}`}>Voltar</Link></div>;
  const titulo = `${novo ? 'Cadastrar' : 'Editar'} ${dados.singular}`;
  return <section className="admin-create-match" aria-labelledby="titulo-configuracao-form">
    <header className="admin-create-heading"><div><button type="button" aria-label="Voltar" onClick={voltar}><ArrowLeft /></button><div><h1 id="titulo-configuracao-form">{titulo}</h1><p>{novo ? 'Informe os dados do novo registro.' : `Atualize os dados de ${item?.nome ?? dados.singular}.`}</p></div></div><div><button type="submit" form="form-configuracao" className="admin-button admin-button-primary" disabled={!pode(operador, 'CADASTROS_GERENCIAR') || !valido || salvar.isPending}>{salvar.isPending ? 'Salvando…' : novo ? 'Cadastrar' : 'Salvar alterações'}</button></div></header>
    <form id="form-configuracao" className="admin-create-grid" onSubmit={submeter}>
      <div className="admin-create-main"><section className="admin-form-card"><header><h2>Dados da {dados.singular}</h2><p>{tipo === 'locais' ? 'Defina a identificação do espaço e as modalidades permitidas.' : tipo === 'modalidades' ? 'Defina como a modalidade será identificada nas partidas.' : 'Defina o nome e o nível utilizado no balanceamento.'}</p></header><div className="admin-form-fields admin-form-fields-two">
        <label>Nome<input autoFocus required maxLength={tipo === 'categorias' ? 50 : 100} value={nome} onChange={e => setNome(e.target.value)} /><span>Obrigatório; até {tipo === 'categorias' ? 50 : 100} caracteres</span></label>
        {tipo !== 'categorias' && <label>Status<select value={ativo ? 'ativo' : 'inativo'} onChange={e => setAtivo(e.target.value === 'ativo')}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select><span>Controla a disponibilidade para novos usos</span></label>}
        {tipo === 'locais' && <label className="admin-form-field-full">Descrição<textarea maxLength={255} rows={4} value={descricao} onChange={e => setDescricao(e.target.value)} /><span>Opcional; até 255 caracteres</span></label>}
        {tipo === 'categorias' && <label>Nível de habilidade<select required value={peso} onChange={e => setPeso(e.target.value)}><option value="1">Iniciante</option><option value="2">Intermediário</option><option value="3">Avançado</option></select><span>Usado para equilibrar as equipes</span></label>}
        {tipo === 'locais' && <fieldset className="admin-local-modalidades admin-form-field-full"><legend>Modalidades permitidas</legend><p>Selecione uma ou mais modalidades para este espaço.</p>{modalidades.data?.map(modalidade => <label key={modalidade.id}><input type="checkbox" checked={modalidadeIds.includes(modalidade.id)} onChange={e => setModalidadeIds(e.target.checked ? [...modalidadeIds, modalidade.id] : modalidadeIds.filter(id => id !== modalidade.id))}/>{modalidade.nome}{modalidade.ativo === false ? ' (inativa)' : ''}</label>)}{modalidades.isSuccess && !modalidades.data.length && <Link to="/admin/configuracoes/modalidades/novo">Cadastre uma modalidade primeiro</Link>}</fieldset>}
        {erroSalvar && <p className="admin-form-error admin-form-field-full" role="alert">{erroSalvar}</p>}
      </div></section>{tipo === 'modalidades' && !novo && <section className="admin-form-card"><header><h2>Locais vinculados</h2><p>Espaços que permitem esta modalidade.</p></header><div className="admin-config-linked-list">{locais.data?.filter(local => local.modalidadeIds?.includes(itemId)).map(local => <span key={local.id}>{local.nome}</span>)}{!locais.data?.some(local => local.modalidadeIds?.includes(itemId)) && <p>Nenhum local vinculado.</p>}</div></section>}</div>
      <aside className="admin-create-side"><section className="admin-form-card"><header><h2>Resumo</h2></header><div className="admin-config-edit-summary"><strong>{nome || `Nova ${dados.singular}`}</strong>{tipo !== 'categorias' && <StatusBadge status={ativo ? 'ATIVO' : 'INATIVO'} rotulo={ativo ? 'Ativo' : 'Inativo'} />}{tipo === 'locais' && <small>{modalidadeIds.length} {modalidadeIds.length === 1 ? 'modalidade selecionada' : 'modalidades selecionadas'}</small>}</div></section>
        {!novo && pode(operador, 'CADASTROS_GERENCIAR') && <section className="admin-form-card admin-match-actions-card"><header><h2>Excluir {dados.singular}</h2><p>O registro será removido permanentemente se não houver vínculos que impeçam a exclusão.</p></header><div className="admin-match-actions"><Confirmacao acionador={<button type="button" className="admin-button admin-button-danger-solid"><Trash2 />Excluir {dados.singular}</button>} titulo={`Excluir ${dados.singular} permanentemente?`} descricao={`${item?.nome ?? 'O registro'} será removido. Esta ação não pode ser desfeita.`} rotuloConfirmacao="Excluir permanentemente" processando={excluir.isPending} aoConfirmar={() => excluir.mutate()} />{erroExcluir && <p className="admin-sheet-error" role="alert">{erroExcluir}</p>}</div></section>}
      </aside>
    </form>
  </section>;
}
