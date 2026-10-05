import { useAuth } from '../contexto/useAuth';
import { pode } from '../seguranca/permissoes';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Paginacao } from '../componentes/ui/Paginacao';
import { StatusBadge } from '../componentes/ui/StatusBadge';
import { adminConfiguracaoService } from '../servicos/adminConfiguracaoService';

type TipoConfiguracao = 'modalidades' | 'locais' | 'categorias';
type Item = { id: string | number; nome: string; peso?: number; ativo?: boolean; modalidadeIds?: string[] };
const niveis: Record<number, string> = { 1: 'Iniciante', 2: 'Intermediário', 3: 'Avançado' };
const dadosConfiguracao = {
  modalidades: { titulo: 'Modalidades', descricao: 'Gerencie as modalidades disponíveis para criação de partidas.', singular: 'modalidade', carregar: adminConfiguracaoService.listarModalidades },
  locais: { titulo: 'Locais', descricao: 'Gerencie os espaços onde as partidas podem acontecer.', singular: 'local', carregar: adminConfiguracaoService.listarLocais },
  categorias: { titulo: 'Categorias', descricao: 'Gerencie as categorias utilizadas para organizar jogadores e partidas.', singular: 'categoria', carregar: adminConfiguracaoService.listarCategorias },
};

export function AdminConfiguracaoListaPage({ tipo }: { tipo: TipoConfiguracao }) {
  const { usuario: operador } = useAuth();
  const dados = dadosConfiguracao[tipo];
  const navigate = useNavigate();
  const [parametros, setParametros] = useSearchParams();
  const filtroModalidade = parametros.get('modalidade') ?? '';
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const consulta = useQuery<Item[]>({ queryKey: ['configuracoes', tipo], queryFn: async () => dados.carregar() });
  const modalidades = useQuery({ queryKey: ['configuracoes', 'modalidades'], queryFn: adminConfiguracaoService.listarModalidades, enabled: tipo === 'locais' });
  const locais = useQuery({ queryKey: ['configuracoes', 'locais'], queryFn: adminConfiguracaoService.listarLocais, enabled: tipo === 'modalidades' });
  const itens = useMemo(() => (consulta.data ?? []).filter(item => item.nome.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR')) && (tipo !== 'locais' || !filtroModalidade || item.modalidadeIds?.includes(filtroModalidade))), [busca, consulta.data, tipo, filtroModalidade]);
  const totalPaginas = Math.max(1, Math.ceil(itens.length / itensPorPagina));
  const itensDaPagina = itens.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);
  useEffect(() => setPagina(1), [busca, filtroModalidade, tipo, itensPorPagina]);
  useEffect(() => { if (pagina > totalPaginas) setPagina(totalPaginas); }, [pagina, totalPaginas]);
  const abrir = (id: string | number) => navigate(`/admin/configuracoes/${tipo}/${id}`);
  return <section className="admin-card admin-users-page" aria-labelledby={`titulo-${tipo}`}>
    <header className="admin-card-header"><div><h1 id={`titulo-${tipo}`}>{dados.titulo}</h1><p>{dados.descricao}</p></div>{pode(operador, 'CADASTROS_GERENCIAR') && <Link className="admin-button admin-button-primary" to={`/admin/configuracoes/${tipo}/novo`}><Plus />Cadastrar {dados.singular}</Link>}</header>
    <div className="admin-users-panel">
      <div className="admin-users-toolbar admin-table-toolbar"><label className="admin-users-search"><span className="sr-only">Buscar</span><div><Search /><input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder={`Buscar ${dados.singular}...`} /></div></label>{tipo === 'locais' && <label className="admin-local-filter">Modalidade<select value={filtroModalidade} onChange={e => setParametros(e.target.value ? { modalidade: e.target.value } : {})}><option value="">Todas as modalidades</option>{modalidades.data?.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></label>}</div>
      {consulta.isSuccess && <div className="admin-filter-feedback" role="status"><span>{itens.length} {itens.length === 1 ? 'registro encontrado' : 'registros encontrados'}</span>{(busca || filtroModalidade) && <b>Filtro aplicado</b>}</div>}
      {consulta.isPending && <div className="admin-table-skeleton"><span /><span /><span /></div>}
      {consulta.isError && <div className="admin-inline-error" role="alert"><span>Não foi possível carregar os dados.</span><button onClick={() => void consulta.refetch()}>Tentar novamente</button></div>}
      {consulta.isSuccess && !itens.length && <div className="admin-empty-state"><h3>Nenhuma {dados.singular} encontrada</h3><p>Os registros cadastrados aparecerão aqui.</p></div>}
      {!!itens.length && <><div className="admin-users-table-wrap"><table className="admin-users-table admin-config-table"><thead><tr><th>Nome</th>{tipo === 'locais' && <th>Modalidades</th>}{tipo === 'modalidades' && <th>Locais vinculados</th>}{tipo === 'categorias' && <th>Nível de habilidade</th>}<th>Status</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{itensDaPagina.map(item => <tr key={item.id} onClick={() => abrir(item.id)}><td><strong>{item.nome}</strong></td>{tipo === 'locais' && <td>{item.modalidadeIds?.length ? modalidades.data?.filter(m => item.modalidadeIds?.includes(m.id)).map(m => m.nome).join(', ') : 'Sem modalidade vinculada'}</td>}{tipo === 'modalidades' && <td>{locais.data?.filter(l => l.modalidadeIds?.includes(String(item.id))).map(l => l.nome).join(', ') || 'Nenhum local vinculado'}</td>}{tipo === 'categorias' && <td>{niveis[item.peso ?? 1]}</td>}<td><StatusBadge status={item.ativo === false ? 'INATIVO' : 'ATIVO'} rotulo={item.ativo === false ? 'Inativo' : 'Ativo'} /></td><td className="admin-user-action"><button type="button" aria-label={`Editar ${item.nome}`} onClick={e => { e.stopPropagation(); abrir(item.id); }}><ChevronRight /></button></td></tr>)}</tbody></table></div><Paginacao total={itens.length} rotuloSingular={dados.singular} rotuloPlural={dados.titulo.toLowerCase()} pagina={pagina} totalPaginas={totalPaginas} itensPorPagina={itensPorPagina} aoMudarPagina={setPagina} aoMudarItensPorPagina={setItensPorPagina}/></>}
    </div>
  </section>;
}
