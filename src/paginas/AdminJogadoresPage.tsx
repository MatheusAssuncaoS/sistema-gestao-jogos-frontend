import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ellipsis, KeyRound, Pencil, Plus, ShieldCheck, UserRound, Search } from 'lucide-react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { adminJogadorService } from '../servicos/adminJogadorService';
import { adminUsuarioService } from '../servicos/adminUsuarioService';
import { ApiError } from '../servicos/api';
import { Paginacao } from '../componentes/ui/Paginacao';
import { StatusBadge } from '../componentes/ui/StatusBadge';
import { useAuth } from '../contexto/useAuth';
import { pode } from '../seguranca/permissoes';

const mensagemDeErro = (erro: unknown) => erro instanceof ApiError ? erro.detail : 'Não foi possível carregar os jogadores.';

export function AdminJogadoresPage() {
  const { usuario: operador } = useAuth();
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [menu, setMenu] = useState<{ usuarioId: string; nome: string; x: number; y: number } | null>(null);
  useEffect(() => {
    if (!menu) return;
    const fechar = (evento: KeyboardEvent) => { if (evento.key === 'Escape') setMenu(null); };
    const fecharAoRolar = () => setMenu(null);
    window.addEventListener('keydown', fechar);
    window.addEventListener('scroll', fecharAoRolar, true);
    return () => { window.removeEventListener('keydown', fechar); window.removeEventListener('scroll', fecharAoRolar, true); };
  }, [menu]);
  const jogadores = useQuery({ queryKey: ['admin', 'jogadores', 'ativos'], queryFn: () => adminJogadorService.listarAtivos('') });
  const usuarios = useQuery({ queryKey: ['admin', 'usuarios'], queryFn: adminUsuarioService.listar });
  const usuariosPorId = useMemo(() => new Map((usuarios.data ?? []).map(usuario => [usuario.id, usuario])), [usuarios.data]);
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return (jogadores.data ?? []).filter(jogador => !termo || `${jogador.nome} ${jogador.email} ${jogador.matriculaAssociado ?? ''} ${jogador.categoria ?? ''}`.toLocaleLowerCase('pt-BR').includes(termo));
  }, [busca, jogadores.data]);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / itensPorPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const jogadoresDaPagina = filtrados.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);
  useEffect(() => setPagina(1), [busca, itensPorPagina]);

  return <section className="admin-card admin-users-page" aria-labelledby="titulo-jogadores">
    <header className="admin-card-header"><div><h1 id="titulo-jogadores">Jogadores</h1><p>Consulte os jogadores aprovados e seus dados esportivos.</p></div><div className="admin-card-header-actions"><button type="button" className="admin-button admin-button-secondary" disabled={jogadores.isFetching} onClick={() => void jogadores.refetch()}>Atualizar</button>{pode(operador, 'USUARIOS_GERENCIAR') && pode(operador, 'SOLICITACOES_GERENCIAR') && <Link to="/admin/usuarios/novo" className="admin-button admin-button-primary"><Plus aria-hidden="true" />Novo jogador</Link>}</div></header>
    <div className="admin-users-panel">
      <div className="admin-users-toolbar admin-table-toolbar"><label className="admin-users-search"><span className="sr-only">Buscar jogadores</span><div><Search aria-hidden="true" /><input type="search" value={busca} onChange={evento => setBusca(evento.target.value)} placeholder="Buscar por nome, e-mail, matrícula ou categoria..." /></div></label></div>
      {jogadores.isPending && <div className="admin-table-skeleton" aria-label="Carregando jogadores"><span /><span /><span /></div>}
      {jogadores.isError && <div className="admin-inline-error" role="alert"><span>{mensagemDeErro(jogadores.error)}</span><button onClick={() => void jogadores.refetch()}>Tentar novamente</button></div>}
      {jogadores.isSuccess && filtrados.length === 0 && <div className="admin-empty-state"><h3>Nenhum jogador encontrado</h3><p>{busca ? 'Ajuste a busca para encontrar um jogador.' : 'Os jogadores aprovados aparecerão aqui.'}</p>{busca && <button className="admin-button admin-button-secondary" onClick={() => setBusca('')}>Limpar busca</button>}</div>}
      {jogadoresDaPagina.length > 0 && <>
        <div className="admin-users-table-wrap admin-player-table-wrap">
          <table className="admin-users-table admin-player-table">
            <thead><tr><th scope="col">Foto</th><th scope="col">Nome</th><th scope="col">E-mail</th><th scope="col">Matrícula</th><th scope="col">Categoria</th><th scope="col">Situação</th><th scope="col" className="admin-player-actions-heading">Ações</th></tr></thead>
            <tbody>{jogadoresDaPagina.map(jogador => {
              const usuario = usuariosPorId.get(jogador.usuarioId);
              const fotoUrl = usuario ? usuario.fotoUrl : jogador.fotoUrl;
              return <tr key={jogador.id} onClick={() => navigate(`/admin/usuarios/${jogador.usuarioId}`)}>
              <td><span className="admin-player-avatar">{fotoUrl ? <img src={fotoUrl} alt="" /> : <span aria-hidden="true">{jogador.nome.trim().split(/\s+/).slice(0, 2).map(parte => parte[0]).join('').toLocaleUpperCase('pt-BR')}</span>}</span></td>
              <td><Link className="admin-player-name" to={`/admin/usuarios/${jogador.usuarioId}`} onClick={evento => evento.stopPropagation()}>{jogador.nome}</Link></td>
              <td><span className="admin-player-email">{jogador.email}</span></td>
              <td><span className="admin-player-email">{jogador.matriculaAssociado || 'Não informada'}</span></td>
              <td><span className="admin-player-email">{jogador.categoria || 'Sem categoria'}</span></td>
              <td><StatusBadge status={jogador.situacaoAssociativa === 'REGULAR' ? 'ATIVO' : jogador.situacaoAssociativa === 'IRREGULAR' ? 'BLOQUEADO' : 'PENDENTE'} rotulo={{ REGULAR: 'Regular', IRREGULAR: 'Irregular', PENDENTE: 'Pendente' }[jogador.situacaoAssociativa]} /></td>
              <td className="admin-player-actions-cell"><button type="button" className="admin-player-actions-trigger" aria-label={`Ações de ${jogador.nome}`} aria-haspopup="menu" aria-expanded={menu?.usuarioId === jogador.usuarioId} onClick={evento => { evento.stopPropagation(); const rect = evento.currentTarget.getBoundingClientRect(); setMenu(atual => atual?.usuarioId === jogador.usuarioId ? null : { usuarioId: jogador.usuarioId, nome: jogador.nome, x: Math.max(12, Math.min(rect.right - 190, window.innerWidth - 202)), y: rect.bottom + 4 + 176 > window.innerHeight ? rect.top - 180 : rect.bottom + 4 }); }}><Ellipsis aria-hidden="true" /></button></td>
            </tr>;
            })}</tbody>
          </table>
        </div>
        <Paginacao total={filtrados.length} rotuloSingular="jogador" rotuloPlural="jogadores" pagina={paginaAtual} totalPaginas={totalPaginas} itensPorPagina={itensPorPagina} aoMudarPagina={setPagina} aoMudarItensPorPagina={setItensPorPagina} />
      </>}
    </div>
    {menu && createPortal(<><button type="button" className="admin-player-menu-backdrop" aria-label="Fechar ações" onClick={() => setMenu(null)} /><div className="admin-player-actions-menu" role="menu" aria-label={`Ações de ${menu.nome}`} style={{ left: menu.x, top: menu.y }}>
      <button type="button" role="menuitem" onClick={() => navigate(`/admin/usuarios/${menu.usuarioId}?aba=perfil`)}><Pencil aria-hidden="true" />Editar perfil</button>
      <button type="button" role="menuitem" onClick={() => navigate(`/admin/usuarios/${menu.usuarioId}?aba=acessos`)}><ShieldCheck aria-hidden="true" />Perfis de acesso</button>
      <button type="button" role="menuitem" onClick={() => navigate(`/admin/usuarios/${menu.usuarioId}?aba=senha`)}><KeyRound aria-hidden="true" />Redefinir senha</button>
      <button type="button" role="menuitem" onClick={() => navigate(`/admin/usuarios/${menu.usuarioId}?aba=conta`)}><UserRound aria-hidden="true" />Gerenciar conta</button>
    </div></>, document.body)}
  </section>;
}
