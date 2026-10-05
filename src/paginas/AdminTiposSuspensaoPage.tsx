import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Search, Save } from 'lucide-react';
import { useAuth } from '../contexto/useAuth';
import { pode } from '../seguranca/permissoes';
import { ApiError } from '../servicos/api';
import { tipoSuspensaoService, type TipoSuspensaoCadastro } from '../servicos/suspensaoService';
import { Paginacao } from '../componentes/ui/Paginacao';
import { StatusBadge } from '../componentes/ui/StatusBadge';
import { Sheet } from '../componentes/ui/painel-lateral';

export function AdminTiposSuspensaoPage() {
  const { usuario } = useAuth();
  const gerenciar = pode(usuario, 'CADASTROS_GERENCIAR');
  const cliente = useQueryClient();
  const consulta = useQuery({ queryKey: ['configuracoes', 'tipos-suspensao'], queryFn: tipoSuspensaoService.listar });
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [quantidade, setQuantidade] = useState(10);
  const [aberto, setAberto] = useState(false);
  const [id, setId] = useState<string>();
  const [nome, setNome] = useState('');
  const [dias, setDias] = useState('1');
  const [ativo, setAtivo] = useState(true);
  const [sucesso, setSucesso] = useState('');
  const salvar = useMutation({
    mutationFn: () => {
      const dados = { nome: nome.trim(), dias: Number(dias), ativo };
      return id ? tipoSuspensaoService.editar(id, dados) : tipoSuspensaoService.criar(dados);
    },
    onSuccess: async () => {
      await cliente.invalidateQueries({ queryKey: ['configuracoes', 'tipos-suspensao'] });
      setAberto(false);
      setSucesso('Tipo de suspensão salvo.');
    },
  });
  function editar(item?: TipoSuspensaoCadastro) {
    setId(item?.id); setNome(item?.nome ?? ''); setDias(String(item?.dias ?? 1));
    setAtivo(item?.ativo ?? true); salvar.reset(); setSucesso(''); setAberto(true);
  }
  const valido = Boolean(nome.trim()) && Number.isInteger(Number(dias)) && Number(dias) >= 1 && Number(dias) <= 3650;
  function submeter(evento: FormEvent) { evento.preventDefault(); if (gerenciar && valido && !salvar.isPending) salvar.mutate(); }
  const itens = (consulta.data ?? []).filter(item => item.nome.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR')));
  const totalPaginas = Math.max(1, Math.ceil(itens.length / quantidade));
  const atual = Math.min(pagina, totalPaginas);

  return <section className="admin-card admin-users-page admin-suspension-types-page">
    <header className="admin-card-header"><div><h1>Tipos de suspensão</h1></div>{gerenciar && <button type="button" className="admin-button admin-button-primary" onClick={() => editar()}><Plus />Cadastrar tipo</button>}</header>
    {sucesso && <p role="status">{sucesso}</p>}
    <div className="admin-users-panel">
      <div className="admin-users-toolbar admin-table-toolbar"><label className="admin-users-search"><span className="sr-only">Buscar tipo de suspensão</span><div><Search /><input type="search" placeholder="Buscar tipo de suspensão..." value={busca} onChange={e => { setBusca(e.target.value); setPagina(1); }} /></div></label></div>
      {consulta.isPending && <div role="status" aria-label="Carregando tipos" className="admin-table-skeleton"><span /><span /><span /></div>}
      {consulta.isError && <div role="alert" className="admin-inline-error"><span>Não foi possível carregar os tipos.</span><button type="button" onClick={() => void consulta.refetch()}>Tentar novamente</button></div>}
      {consulta.isSuccess && <div className="admin-filter-feedback" role="status"><span>{itens.length} {itens.length === 1 ? 'registro encontrado' : 'registros encontrados'}</span>{busca && <b>Filtro aplicado</b>}</div>}
      {consulta.isSuccess && !itens.length && <div className="admin-empty-state"><h3>Nenhum tipo de suspensão encontrado</h3></div>}
      {itens.length > 0 && <><div className="admin-users-table-wrap"><table className="admin-users-table admin-config-table admin-suspension-types-table"><thead><tr><th>Nome</th><th>Dias de suspensão</th><th>Status</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{itens.slice((atual - 1) * quantidade, atual * quantidade).map(item => <tr key={item.id}><td><strong>{item.nome}</strong></td><td>{item.dias} {item.dias === 1 ? 'dia' : 'dias'}</td><td><StatusBadge status={item.ativo ? 'ATIVO' : 'INATIVO'} rotulo={item.ativo ? 'Ativo' : 'Inativo'} /></td><td className="admin-user-action">{gerenciar && <button type="button" title={`Editar ${item.nome}`} aria-label={`Editar ${item.nome}`} onClick={() => editar(item)}><Pencil /></button>}</td></tr>)}</tbody></table></div><Paginacao total={itens.length} rotuloSingular="tipo" rotuloPlural="tipos" pagina={atual} totalPaginas={totalPaginas} itensPorPagina={quantidade} aoMudarPagina={setPagina} aoMudarItensPorPagina={valor => { setQuantidade(valor); setPagina(1); }} /></>}
    </div>
    <Sheet aberto={aberto} aoAlterar={valor => { if (!salvar.isPending) setAberto(valor); }} titulo={id ? 'Editar tipo de suspensão' : 'Cadastrar tipo de suspensão'}>
      <form onSubmit={submeter} className="admin-type-suspension-form">
        <div className="admin-form-fields">
          <label>Nome<input autoFocus required maxLength={100} value={nome} disabled={salvar.isPending} onChange={e => setNome(e.target.value)} /></label>
          <label>Dias de suspensão<input type="number" required min={1} max={3650} step={1} value={dias} disabled={salvar.isPending} onChange={e => setDias(e.target.value)} /></label>
          <label className="admin-type-active"><input type="checkbox" checked={ativo} disabled={salvar.isPending} onChange={e => setAtivo(e.target.checked)} />Ativo</label>
          {salvar.isError && <p role="alert" className="admin-form-error">{salvar.error instanceof ApiError ? salvar.error.detail : 'Não foi possível salvar o tipo.'}</p>}
        </div>
        <footer><button type="button" className="admin-button admin-button-secondary" disabled={salvar.isPending} onClick={() => setAberto(false)}>Cancelar</button><button type="submit" className="admin-button admin-button-primary" disabled={!gerenciar || !valido || salvar.isPending}><Save />{salvar.isPending ? 'Salvando...' : 'Salvar'}</button></footer>
      </form>
    </Sheet>
  </section>;
}
