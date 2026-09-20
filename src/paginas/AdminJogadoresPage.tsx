import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { adminJogadorService } from '../servicos/adminJogadorService';
import { ApiError } from '../servicos/api';
import { Paginacao } from '../componentes/ui/Paginacao';
import { StatusBadge } from '../componentes/ui/StatusBadge';

const mensagemDeErro = (erro: unknown) => erro instanceof ApiError ? erro.detail : 'Não foi possível carregar os jogadores.';

export function AdminJogadoresPage() {
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const jogadores = useQuery({ queryKey: ['admin', 'jogadores', 'ativos'], queryFn: () => adminJogadorService.listarAtivos('') });
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    return (jogadores.data ?? []).filter(jogador => !termo || `${jogador.nome} ${jogador.email} ${jogador.matriculaAssociado ?? ''} ${jogador.categoria ?? ''}`.toLocaleLowerCase('pt-BR').includes(termo));
  }, [busca, jogadores.data]);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / itensPorPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const jogadoresDaPagina = filtrados.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);
  useEffect(() => setPagina(1), [busca, itensPorPagina]);

  return <section className="admin-card admin-users-page" aria-labelledby="titulo-jogadores">
    <header className="admin-card-header"><div><h1 id="titulo-jogadores">Jogadores</h1><p>Consulte os jogadores aprovados e seus dados esportivos.</p></div><button type="button" className="admin-button admin-button-secondary" disabled={jogadores.isFetching} onClick={() => void jogadores.refetch()}>Atualizar</button></header>
    <div className="admin-users-panel">
      <div className="admin-users-toolbar admin-table-toolbar"><label className="admin-users-search"><span className="sr-only">Buscar jogadores</span><div><Search aria-hidden="true" /><input type="search" value={busca} onChange={evento => setBusca(evento.target.value)} placeholder="Buscar por nome, e-mail, matrícula ou categoria..." /></div></label></div>
      {jogadores.isPending && <div className="admin-table-skeleton" aria-label="Carregando jogadores"><span /><span /><span /></div>}
      {jogadores.isError && <div className="admin-inline-error" role="alert"><span>{mensagemDeErro(jogadores.error)}</span><button onClick={() => void jogadores.refetch()}>Tentar novamente</button></div>}
      {jogadores.isSuccess && filtrados.length === 0 && <div className="admin-empty-state"><h3>Nenhum jogador encontrado</h3><p>{busca ? 'Ajuste a busca para encontrar um jogador.' : 'Os jogadores aprovados aparecerão aqui.'}</p>{busca && <button className="admin-button admin-button-secondary" onClick={() => setBusca('')}>Limpar busca</button>}</div>}
      {jogadoresDaPagina.length > 0 && <><div className="admin-users-table-wrap"><table className="admin-users-table"><thead><tr><th>Jogador</th><th>Matrícula</th><th>Categoria</th><th>Situação</th></tr></thead><tbody>{jogadoresDaPagina.map(jogador => <tr key={jogador.id}><td><strong>{jogador.nome}</strong><small>{jogador.email}</small></td><td>{jogador.matriculaAssociado ?? 'Não informada'}</td><td>{jogador.categoria ?? 'Sem categoria'}</td><td><StatusBadge status={jogador.situacaoAssociativa === 'REGULAR' ? 'ATIVO' : jogador.situacaoAssociativa === 'IRREGULAR' ? 'BLOQUEADO' : 'PENDENTE'} rotulo={{ REGULAR: 'Regular', IRREGULAR: 'Irregular', PENDENTE: 'Pendente' }[jogador.situacaoAssociativa]} /></td></tr>)}</tbody></table></div><Paginacao total={filtrados.length} rotuloSingular="jogador" rotuloPlural="jogadores" pagina={paginaAtual} totalPaginas={totalPaginas} itensPorPagina={itensPorPagina} aoMudarPagina={setPagina} aoMudarItensPorPagina={setItensPorPagina} /></>}
    </div>
  </section>;
}
