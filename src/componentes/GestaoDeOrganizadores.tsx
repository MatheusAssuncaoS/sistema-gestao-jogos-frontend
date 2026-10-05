import { funcionario, nomesPerfis, pode } from '../seguranca/permissoes';
import { useAuth } from '../contexto/useAuth';
import { perfilAcessoService } from '../servicos/perfilAcessoService';
import './GestaoDeUsuarios.css';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Ellipsis, Plus, RotateCcw, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { adminUsuarioService } from '../servicos/adminUsuarioService';
import { ApiError } from '../servicos/api';
import type { StatusUsuario, UsuarioResumo } from '../servicos/tipos';
import { Paginacao } from './ui/Paginacao';
import { StatusBadge } from './ui/StatusBadge';

const rotulosStatus: Record<StatusUsuario, string> = { PENDENTE: 'Pendente', ATIVO: 'Ativo', BLOQUEADO: 'Bloqueado', INATIVO: 'Inativo', RECUSADO: 'Recusado' };
type CampoOrdenacao = 'usuario' | 'email' | 'perfis' | 'status';

function mensagemDeErro(falha: unknown) {
  if (falha instanceof ApiError) {
    if (falha.status === 409) return 'Este usuário foi atualizado por outro administrador. Atualize a lista.';
    return falha.detail;
  }
  return 'Não foi possível completar a operação. Tente novamente.';
}

export function GestaoDeUsuarios() {
  const navigate = useNavigate();
  const { usuario: operador } = useAuth();
  const perfisConsulta = useQuery({ queryKey: ['admin', 'perfis'], queryFn: perfilAcessoService.listar });
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState<StatusUsuario | 'TODOS'>('TODOS');
  const [papel, setPapel] = useState('TODOS');
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [ordenacao, setOrdenacao] = useState<{ campo: CampoOrdenacao; direcao: 'asc' | 'desc' }>({ campo: 'usuario', direcao: 'asc' });

  const usuarios = useQuery({ queryKey: ['admin', 'usuarios'], queryFn: adminUsuarioService.listar });
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return (usuarios.data ?? []).filter((usuario) => funcionario(usuario) && (!termo || usuario.nome.toLocaleLowerCase('pt-BR').includes(termo) || usuario.email.toLocaleLowerCase('pt-BR').includes(termo)) && (status === 'TODOS' || usuario.status === status) && (papel === 'TODOS' || usuario.perfis?.some(p => String(p.id) === papel)));
  }, [busca, status, papel, usuarios.data]);
  const ordenados = useMemo(() => [...filtrados].sort((a, b) => {
    const valores: Record<CampoOrdenacao, [string, string]> = {
      usuario: [a.nome, b.nome],
      email: [a.email, b.email],
      perfis: [nomesPerfis(a).join(' '), nomesPerfis(b).join(' ')],
      status: [rotulosStatus[a.status], rotulosStatus[b.status]],
    };
    const comparacao = valores[ordenacao.campo][0].localeCompare(valores[ordenacao.campo][1], 'pt-BR', { sensitivity: 'base', numeric: true });
    return ordenacao.direcao === 'asc' ? comparacao : -comparacao;
  }), [filtrados, ordenacao]);
  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / itensPorPagina));
  const usuariosDaPagina = ordenados.slice((pagina - 1) * itensPorPagina, pagina * itensPorPagina);

  useEffect(() => { setPagina(1); }, [busca, status, papel]);
  useEffect(() => { if (pagina > totalPaginas) setPagina(totalPaginas); }, [pagina, totalPaginas]);

  function abrir(usuario: UsuarioResumo) { navigate(`/admin/seguranca/usuarios/${usuario.id}`); }

  function ordenarPor(campo: CampoOrdenacao) {
    setOrdenacao((atual) => ({ campo, direcao: atual.campo === campo && atual.direcao === 'asc' ? 'desc' : 'asc' }));
    setPagina(1);
  }

  return (
    <section className="admin-card admin-users-page admin-user-list-page pace-users-page" aria-labelledby="titulo-usuarios">
      <header className="admin-card-header"><div><h1 id="titulo-usuarios">Usuários</h1><p>Gerencie as contas dos funcionários que acessam o sistema.</p></div><div className="pace-users-header-actions"><button type="button" onClick={() => void usuarios.refetch()} disabled={usuarios.isFetching} className="admin-button admin-button-secondary">Atualizar</button>{pode(operador, 'USUARIOS_GERENCIAR') && <Link to="/admin/seguranca/usuarios/novo" className="admin-button admin-button-primary"><Plus />Cadastrar usuário</Link>}</div></header>
      <div className="admin-users-panel">
        <div className="admin-users-toolbar pace-users-toolbar">
          <label className="admin-users-search"><span className="sr-only">Buscar usuários</span><div><Search aria-hidden="true" /><input type="search" value={busca} onChange={evento => setBusca(evento.target.value)} placeholder="Buscar por nome ou e-mail..." /></div></label>
          <label className="pace-users-filter"><span className="sr-only">Perfil</span><select value={papel} onChange={evento => setPapel(evento.target.value)}><option value="TODOS">Todos os perfis</option>{perfisConsulta.data?.filter(p => p.codigo !== 'JOGADOR').map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></label>
          <label className="pace-users-filter"><span className="sr-only">Status</span><select value={status} onChange={evento => setStatus(evento.target.value as StatusUsuario | 'TODOS')}><option value="TODOS">Todos os status</option>{Object.entries(rotulosStatus).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}</select></label>
          {(busca || status !== 'TODOS' || papel !== 'TODOS') && <button type="button" className="admin-user-clear-filters" onClick={() => { setBusca(''); setStatus('TODOS'); setPapel('TODOS'); }}><RotateCcw aria-hidden="true" />Limpar filtros</button>}
        </div>
        {usuarios.isError && <div className="admin-inline-error" role="alert"><span>{mensagemDeErro(usuarios.error)}</span><button onClick={() => void usuarios.refetch()}>Tentar novamente</button></div>}
        {usuarios.isPending && <div className="admin-table-skeleton" aria-label="Carregando usuários"><span /><span /><span /><span /></div>}
        {usuarios.isSuccess && filtrados.length === 0 && <div className="admin-empty-state"><h3>Nenhum funcionário encontrado</h3><p>Ajuste a busca ou os filtros para encontrar uma conta de funcionário.</p><button className="admin-button admin-button-secondary" onClick={() => { setBusca(''); setStatus('TODOS'); setPapel('TODOS'); }}>Limpar filtros</button></div>}
        {filtrados.length > 0 && <><div className="admin-users-table-wrap"><table className="admin-users-table"><thead><tr><th className="pace-user-avatar-column"><span className="sr-only">Avatar</span></th><CabecalhoOrdenavel rotulo="Usuário" campo="usuario" ordenacao={ordenacao} aoOrdenar={ordenarPor} /><CabecalhoOrdenavel rotulo="Perfis" campo="perfis" ordenacao={ordenacao} aoOrdenar={ordenarPor} /><CabecalhoOrdenavel rotulo="Status" campo="status" ordenacao={ordenacao} aoOrdenar={ordenarPor} /><th>Ações</th></tr></thead><tbody>{usuariosDaPagina.map((usuario) => { const perfis = nomesPerfis(usuario); return <tr key={usuario.id} onClick={() => abrir(usuario)}><td className="pace-user-avatar-column"><span className="pace-user-avatar" aria-hidden="true">{usuario.nome.trim().split(/\s+/).slice(0, 2).map(parte => parte[0]).join('').toLocaleUpperCase('pt-BR')}</span></td><td><div className="pace-user-identity"><strong>{usuario.nome}</strong><small>{usuario.email}</small></div></td><td><div className="pace-user-roles">{perfis.map(item => <span key={item}>{item}</span>)}</div></td><td><StatusBadge status={usuario.status} rotulo={rotulosStatus[usuario.status]} /></td><td className="admin-user-action"><button type="button" onClick={(evento) => { evento.stopPropagation(); abrir(usuario); }} aria-label={`Ações de ${usuario.nome}`}><Ellipsis aria-hidden="true" /></button></td></tr>; })}</tbody></table></div><Paginacao total={filtrados.length} rotuloSingular="usuário" rotuloPlural="usuários" pagina={pagina} totalPaginas={totalPaginas} itensPorPagina={itensPorPagina} aoMudarPagina={setPagina} aoMudarItensPorPagina={(quantidade) => { setItensPorPagina(quantidade); setPagina(1); }} /></>}
      </div>

    </section>
  );
}

function CabecalhoOrdenavel({ rotulo, campo, ordenacao, aoOrdenar }: { rotulo: string; campo: CampoOrdenacao; ordenacao: { campo: CampoOrdenacao; direcao: 'asc' | 'desc' }; aoOrdenar: (campo: CampoOrdenacao) => void }) {
  const ativo = ordenacao.campo === campo;
  const Icone = !ativo ? ArrowUpDown : ordenacao.direcao === 'asc' ? ArrowUp : ArrowDown;
  return <th aria-sort={!ativo ? 'none' : ordenacao.direcao === 'asc' ? 'ascending' : 'descending'}><button type="button" className={ativo ? 'active' : ''} onClick={() => aoOrdenar(campo)}>{rotulo}<Icone aria-hidden="true" /></button></th>;
}
