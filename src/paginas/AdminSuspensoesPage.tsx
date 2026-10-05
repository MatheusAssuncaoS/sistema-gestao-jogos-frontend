import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, CircleStop } from 'lucide-react';
import { StatusBadge } from '../componentes/ui/StatusBadge';
import { ApiError } from '../servicos/api';
import { suspensaoService, type TipoSuspensao, type SuspensaoJogador } from '../servicos/suspensaoService';
import { Paginacao } from '../componentes/ui/Paginacao';
import { Confirmacao } from '../componentes/ui/Confirmacao';
import { useAuth } from '../contexto/useAuth';
import { pode } from '../seguranca/permissoes';
import { AvisoTemporario } from '../componentes/ui/AvisoTemporario';

const rotulos: Record<TipoSuspensao, string> = { DISCIPLINAR: 'Disciplinar', ADMINISTRATIVA: 'Administrativa', OUTRA: 'Outra' };
const formatoData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const hojeNoClube = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
const erroTexto = (erro: unknown) => erro instanceof ApiError ? erro.detail : 'Não foi possível concluir a operação.';
const dataFormatada = (data: string) => formatoData.format(new Date(`${data}T12:00:00Z`));

function statusDaSuspensao(suspensao: SuspensaoJogador, hoje: string) {
  if (suspensao.encerradaEm || (suspensao.fim && suspensao.fim < hoje)) return 'Encerrada';
  if (suspensao.inicio > hoje) return 'Agendada';
  return 'Ativa';
}

export function AdminSuspensoesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const podeGerenciar = pode(usuario, 'USUARIOS_GERENCIAR');
  const queryClient = useQueryClient();
  const suspensoes = useQuery({ queryKey: ['admin', 'suspensoes'], queryFn: suspensaoService.listar });
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [pagina, setPagina] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [aviso, setAviso] = useState(() => (location.state as { aviso?: string } | null)?.aviso ?? '');
  const hoje = hojeNoClube();
  const encerrar = useMutation({
    mutationFn: (id: string) => suspensaoService.encerrar(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin', 'suspensoes'] }),
  });
  const filtradas = useMemo(() => (suspensoes.data ?? []).filter(item => {
    const corresponde = `${item.nome} ${item.email} ${item.matriculaAssociado ?? ''} ${item.motivo}`.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR'));
    return corresponde && (filtro === 'todas' || statusDaSuspensao(item, hoje) === filtro);
  }), [suspensoes.data, busca, filtro, hoje]);
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / itensPorPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const linhas = filtradas.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina);
  useEffect(() => {
    if ((location.state as { aviso?: string } | null)?.aviso) navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  return <section className="admin-card admin-users-page admin-suspensions-page" aria-labelledby="titulo-suspensoes">
    <header className="admin-card-header"><div><h1 id="titulo-suspensoes">Suspensões</h1><p>Histórico de suspensões registradas para jogadores do clube.</p></div>{podeGerenciar && <Link className="admin-button admin-button-primary" to="/admin/suspensoes/nova"><Plus aria-hidden="true" />Registrar suspensão</Link>}</header>
    <div className="admin-users-panel">
      <div className="admin-users-toolbar admin-table-toolbar admin-suspension-toolbar"><label className="admin-users-search"><span className="sr-only">Buscar suspensões</span><div><Search aria-hidden="true" /><input type="search" value={busca} onChange={e => { setBusca(e.target.value); setPagina(1); }} placeholder="Buscar por jogador, matrícula ou motivo..." /></div></label><label className="admin-suspension-filter">Situação<select value={filtro} onChange={e => { setFiltro(e.target.value); setPagina(1); }}><option value="todas">Todas</option><option value="Ativa">Ativas</option><option value="Agendada">Agendadas</option><option value="Encerrada">Encerradas</option></select></label></div>
      {suspensoes.isPending && <div className="admin-table-skeleton" role="status" aria-label="Carregando suspensões"><span /><span /><span /></div>}
      {suspensoes.isSuccess && <div className="admin-filter-feedback" role="status"><span>{filtradas.length} {filtradas.length === 1 ? 'registro encontrado' : 'registros encontrados'}</span>{(busca || filtro !== 'todas') && <b>Filtro aplicado</b>}</div>}
      {suspensoes.isError && <div className="admin-inline-error" role="alert"><span>{erroTexto(suspensoes.error)}</span><button type="button" onClick={() => void suspensoes.refetch()}>Tentar novamente</button></div>}
      {suspensoes.isSuccess && filtradas.length === 0 && <div className="admin-empty-state"><h3>Nenhuma suspensão encontrada</h3><p>{busca || filtro !== 'todas' ? 'Ajuste a busca ou o filtro.' : 'As suspensões registradas aparecerão aqui.'}</p></div>}
      {linhas.length > 0 && <><div className="admin-users-table-wrap admin-suspension-table-wrap"><table className="admin-users-table admin-suspension-table"><thead><tr><th>Jogador</th><th>Tipo / Motivo</th><th>Período</th><th>Situação</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{linhas.map(item => {
        const status = statusDaSuspensao(item, hoje);
        return <tr key={item.id}>
          <td><span className="admin-suspension-person"><span className="admin-player-avatar">{item.fotoUrl ? <img src={item.fotoUrl} alt="" /> : item.nome.trim().split(/\s+/).slice(0, 2).map(parte => parte[0]).join('').toUpperCase()}</span><span><Link to={`/admin/usuarios/${item.usuarioId}`}>{item.nome}</Link><small>{item.matriculaAssociado ? `Matrícula ${item.matriculaAssociado}` : 'Sem matrícula'}</small></span></span></td>
          <td className="admin-suspension-motive"><strong>{item.tipoNome || rotulos[item.tipo]}</strong><small>{item.motivo}</small></td>
          <td><span>{dataFormatada(item.inicio)}</span><small>{item.fim ? `até ${dataFormatada(item.fim)}` : 'Sem término'}</small></td>
          <td><StatusBadge status={status === 'Ativa' ? 'BLOQUEADO' : status === 'Agendada' ? 'PENDENTE' : 'ENCERRADA'} rotulo={status} /></td>
          <td className="admin-user-action">{podeGerenciar && status !== 'Encerrada' && <Confirmacao acionador={<button type="button" title="Encerrar suspensão" aria-label={`Encerrar suspensão de ${item.nome}`} disabled={encerrar.isPending}><CircleStop /></button>} titulo="Encerrar suspensão?" descricao={`A suspensão de ${item.nome} será encerrada, mas permanecerá no histórico.`} rotuloConfirmacao="Encerrar suspensão" processando={encerrar.isPending} aoConfirmar={() => encerrar.mutate(item.id)} />}</td>
        </tr>;
      })}</tbody></table></div><Paginacao total={filtradas.length} rotuloSingular="suspensão" rotuloPlural="suspensões" pagina={paginaAtual} totalPaginas={totalPaginas} itensPorPagina={itensPorPagina} aoMudarPagina={setPagina} aoMudarItensPorPagina={quantidade => { setItensPorPagina(quantidade); setPagina(1); }} /></>}
      {encerrar.isError && <p role="alert" className="admin-form-error">{erroTexto(encerrar.error)}</p>}
    </div>
    {aviso && <AvisoTemporario mensagem={aviso} aoFechar={() => setAviso('')} />}
  </section>;
}
