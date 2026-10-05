import { useQuery } from '@tanstack/react-query';
import { ChevronRight, LockKeyhole, Pencil, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Paginacao } from '../componentes/ui/Paginacao';
import { StatusBadge } from '../componentes/ui/StatusBadge';
import { AvisoTemporario } from '../componentes/ui/AvisoTemporario';
import { useAuth } from '../contexto/useAuth';
import { pode } from '../seguranca/permissoes';
import { perfilAcessoService } from '../servicos/perfilAcessoService';
import './PerfisAcesso.css';

export function AdminPerfisAcessoPage() {
  const { usuario } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [aviso, setAviso] = useState<string | null>((location.state as { aviso?: string } | null)?.aviso ?? null);
  const consulta = useQuery({ queryKey: ['admin', 'perfis'], queryFn: perfilAcessoService.listar });
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('TODOS');
  const [tipo, setTipo] = useState('TODOS');
  const [pagina, setPagina] = useState(1);
  const [quantidade, setQuantidade] = useState(10);
  const filtrados = (consulta.data ?? []).filter(p => `${p.nome} ${p.descricao}`.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR')) && (status === 'TODOS' || p.ativo === (status === 'ATIVO')) && (tipo === 'TODOS' || p.sistema === (tipo === 'SISTEMA')));
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / quantidade));
  const atual = Math.min(pagina, totalPaginas);
  return <section className="admin-card admin-users-page" aria-labelledby="titulo-perfis-acesso">
    <header className="admin-card-header"><div><h1 id="titulo-perfis-acesso">Perfis de acesso</h1><p>Defina o que cada perfil pode consultar e gerenciar no clube.</p></div>{pode(usuario, 'PERFIS_GERENCIAR') && <Link className="admin-button admin-button-primary" to="/admin/seguranca/perfis/novo"><Plus aria-hidden="true" />Cadastrar perfil</Link>}</header>
    {aviso && <AvisoTemporario mensagem={aviso} aoFechar={() => setAviso(null)} />}
    <div className="admin-users-panel">
      <div className="admin-users-toolbar admin-table-toolbar">
        <label className="admin-users-search"><span className="sr-only">Buscar perfil</span><div><Search aria-hidden="true" /><input type="search" value={busca} onChange={e => { setBusca(e.target.value); setPagina(1); }} placeholder="Buscar por nome ou descrição..." /></div></label>
        <label className="admin-local-filter"><span className="sr-only">Status</span><select value={status} onChange={e => { setStatus(e.target.value); setPagina(1); }}><option value="TODOS">Todos os status</option><option value="ATIVO">Ativos</option><option value="INATIVO">Inativos</option></select></label>
        <label className="admin-local-filter"><span className="sr-only">Tipo de perfil</span><select value={tipo} onChange={e => { setTipo(e.target.value); setPagina(1); }}><option value="TODOS">Todos os tipos</option><option value="SISTEMA">Do sistema</option><option value="PERSONALIZADO">Personalizados</option></select></label>
      </div>
      {consulta.isPending && <div className="admin-table-skeleton" role="status" aria-label="Carregando perfis"><span /><span /><span /></div>}
      {consulta.isError && <div className="admin-inline-error" role="alert"><span>Não foi possível carregar os perfis.</span><button onClick={() => void consulta.refetch()}>Tentar novamente</button></div>}
      {consulta.isSuccess && <><div className="admin-filter-feedback" role="status"><span>{filtrados.length} {filtrados.length === 1 ? 'perfil encontrado' : 'perfis encontrados'}</span>{(busca || status !== 'TODOS' || tipo !== 'TODOS') && <button type="button" onClick={() => { setBusca(''); setStatus('TODOS'); setTipo('TODOS'); setPagina(1); }}>Limpar filtros</button>}</div>
        {filtrados.length ? <><div className="admin-users-table-wrap"><table className="admin-users-table perfil-table"><thead><tr><th>Perfil</th><th>Tipo</th><th>Acessos</th><th>Usuários</th><th>Status</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{filtrados.slice((atual - 1) * quantidade, atual * quantidade).map(perfil => <tr key={perfil.id} onClick={() => navigate(`/admin/seguranca/perfis/${perfil.id}`)}>
          <td><Link className="perfil-name-link" to={`/admin/seguranca/perfis/${perfil.id}`}>{perfil.nome}</Link><small className="perfil-description">{perfil.descricao || 'Sem descrição'}</small></td>
          <td><span className="perfil-type">{perfil.sistema && <LockKeyhole size={13} aria-hidden="true" />}{perfil.sistema ? 'Do sistema' : 'Personalizado'}</span></td><td>{perfil.permissoes.length} permissões</td><td>{perfil.usuarios}</td><td><StatusBadge status={perfil.ativo ? 'ATIVO' : 'INATIVO'} rotulo={perfil.ativo ? 'Ativo' : 'Inativo'} /></td>
          <td className="admin-user-action"><Link to={`/admin/seguranca/perfis/${perfil.id}`} aria-label={`${perfil.sistema ? 'Ver' : 'Editar'} perfil ${perfil.nome}`}>{perfil.sistema ? <ChevronRight size={18} /> : <Pencil size={17} />}</Link></td>
        </tr>)}</tbody></table></div><Paginacao total={filtrados.length} rotuloSingular="perfil" rotuloPlural="perfis" pagina={atual} totalPaginas={totalPaginas} itensPorPagina={quantidade} aoMudarPagina={setPagina} aoMudarItensPorPagina={n => { setQuantidade(n); setPagina(1); }} /></> : <div className="admin-empty-state"><h3>Nenhum perfil encontrado</h3><p>Altere a busca ou os filtros para encontrar um perfil.</p></div>}
      </>}
    </div>
    <p className="perfil-list-note"><LockKeyhole size={14} aria-hidden="true" />Os perfis do sistema são protegidos. Use um deles como modelo para criar um perfil personalizado.</p>
  </section>;
}
