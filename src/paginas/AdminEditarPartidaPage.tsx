import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, MapPin, ShieldCheck, Trash2, UsersRound } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ApiError } from '../servicos/api';
import { organizadorPartidaService } from '../servicos/organizadorPartidaService';
import { StatusBadge } from '../componentes/ui/StatusBadge';
import { AvisoTemporario } from '../componentes/ui/AvisoTemporario';
import { Confirmacao } from '../componentes/ui/Confirmacao';
import { CampoDataHora } from '../componentes/ui/CampoDataHora';
import type { Partida } from '../servicos/tipos';

const formatoData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

function mensagemDeErro(falha: unknown) {
  return falha instanceof ApiError ? falha.detail : 'Não foi possível salvar a partida. Tente novamente.';
}

export function AdminEditarPartidaPage() {
  const { partidaId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const partidas = useQuery({ queryKey: ['partidas', 'gestao'], queryFn: organizadorPartidaService.listar });
  const locais = useQuery({ queryKey: ['partidas', 'locais'], queryFn: organizadorPartidaService.listarLocais });
  const categorias = useQuery({ queryKey: ['partidas', 'categorias'], queryFn: organizadorPartidaService.listarCategorias });
  const [aviso, setAviso] = useState('');
  const [localId, setLocalId] = useState('');
  const inscritos = useQuery({ queryKey: ['partidas', partidaId, 'inscritos'], queryFn: () => organizadorPartidaService.listarInscritos(partidaId), enabled: partidaId !== '' });
  const partida = partidas.data?.find((item) => item.id === partidaId);
  const [categoriaId, setCategoriaId] = useState('');
  const [duracao, setDuracao] = useState('60');
  const duracaoValida = Number.isInteger(Number(duracao)) && Number(duracao) >= 1 && Number(duracao) <= 1440;
  const [inicio, setInicio] = useState('');
  const [inscricoesAbremEm, setInscricoesAbremEm] = useState('');
  const [inscricoesEncerramEm, setInscricoesEncerramEm] = useState('');

  useEffect(() => {
    if (!partida) return;
    setLocalId(locais.data?.find((item) => item.nome === partida.local)?.id ?? '');
    setCategoriaId(String(categorias.data?.find((item) => item.nome === partida.categoria)?.id ?? ''));
    setInicio(partida.inicio);
    setDuracao(String(partida.duracaoMinutos ?? 60));
    setInscricoesAbremEm(paraDataLocal(partida.inscricoesAbremEm));
    setInscricoesEncerramEm(paraDataLocal(partida.inscricoesEncerramEm));
  }, [partida, locais.data, categorias.data]);

  const periodoInvalido = inscricoesAbremEm !== '' && inscricoesEncerramEm !== '' && new Date(inscricoesAbremEm).getTime() >= new Date(inscricoesEncerramEm).getTime();
  const edicao = useMutation({
    mutationFn: () => organizadorPartidaService.editar(partidaId, {
      localId,
      categoriaId: categoriaId ? Number(categoriaId) : undefined,
      inicio,
      duracaoMinutos: Number(duracao),
      inscricoesAbremEm: inscricoesAbremEm ? new Date(inscricoesAbremEm).toISOString() : undefined,
      inscricoesEncerramEm: inscricoesEncerramEm ? new Date(inscricoesEncerramEm).toISOString() : undefined,
      versao: partida!.versao,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['partidas', 'gestao'] });
      navigate('/admin/partidas', { replace: true });
    },
  });

  const abertura = useMutation({
    mutationFn: () => organizadorPartidaService.abrir(partidaId),
    onSuccess: async (atualizada) => {
      queryClient.setQueryData<Partida[]>(['partidas', 'gestao'], atuais => atuais?.map(item => item.id === atualizada.id ? atualizada : item));
      setAviso('Partida aberta para inscrições.');
      await queryClient.invalidateQueries({ queryKey: ['partidas'] });
    },
  });
  const concluirStatus = async (atualizada: Partida, mensagem: string) => {
    queryClient.setQueryData<Partida[]>(['partidas', 'gestao'], atuais => atuais?.map(item => item.id === atualizada.id ? atualizada : item));
    setAviso(mensagem);
    await queryClient.invalidateQueries({ queryKey: ['partidas'] });
  };
  const cancelamento = useMutation({
    mutationFn: () => organizadorPartidaService.cancelar(partidaId),
    onSuccess: atualizada => concluirStatus(atualizada, 'Partida cancelada. As inscrições ativas também foram canceladas.'),
  });
  const exclusao = useMutation({
    mutationFn: () => organizadorPartidaService.excluir(partidaId),
    onSuccess: atualizada => concluirStatus(atualizada, 'Partida excluída e mantida no histórico.'),
  });
  const alteracoesPendentes = Boolean(partida && (
    localId !== (locais.data?.find(item => item.nome === partida.local)?.id ?? '') ||
    categoriaId !== String(categorias.data?.find(item => item.nome === partida.categoria)?.id ?? '') ||
    inicio !== partida.inicio ||
    Number(duracao) !== (partida.duracaoMinutos ?? 60) ||
    inscricoesAbremEm !== paraDataLocal(partida.inscricoesAbremEm) ||
    inscricoesEncerramEm !== paraDataLocal(partida.inscricoesEncerramEm)
  ));

  function submeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (partida && localId && inicio && duracaoValida && !periodoInvalido) edicao.mutate();
  }

  const carregando = partidas.isPending || locais.isPending || categorias.isPending;
  if (carregando) return <div className="admin-table-skeleton" aria-label="Carregando partida"><span /><span /><span /><span /></div>;
  if (partidas.isError || locais.isError || categorias.isError) return <div className="admin-inline-error" role="alert"><span>Não foi possível carregar os dados da partida.</span><button type="button" onClick={() => { void partidas.refetch(); void locais.refetch(); void categorias.refetch(); }}>Tentar novamente</button></div>;
  if (!partida) return <div className="admin-empty-state"><h3>Partida não encontrada</h3><p>Ela pode ter sido removida ou não está mais disponível.</p><button className="admin-button admin-button-secondary" onClick={() => navigate('/admin/partidas')}>Voltar para partidas</button></div>;

  return <section className="admin-create-match" aria-labelledby="titulo-editar-partida">
    <header className="admin-create-heading"><div><button type="button" aria-label="Voltar para partidas" onClick={() => navigate('/admin/partidas')}><ArrowLeft aria-hidden="true" /></button><div><h1 id="titulo-editar-partida">Editar partida</h1><p>{partida.modalidade} · {formatoData.format(new Date(partida.inicio))}</p></div></div><div><button type="submit" form="form-editar-partida" className="admin-button admin-button-primary" disabled={!['RASCUNHO', 'ABERTA'].includes(partida.status) || abertura.isPending || edicao.isPending || !localId || !inicio || !duracaoValida || periodoInvalido}>{edicao.isPending ? 'Salvando…' : 'Salvar alterações'}</button></div></header>
    {aviso && <AvisoTemporario mensagem={aviso} aoFechar={() => setAviso('')} />}
    <form id="form-editar-partida" className="admin-create-grid" onSubmit={submeter}>
      <div className="admin-create-main"><section className="admin-form-card"><header className="admin-match-details-header"><div><div className="admin-registration-title"><h2>Detalhes da partida</h2><StatusBadge status={partida.status} rotulo={{ RASCUNHO: 'Rascunho', ABERTA: 'Aberta', LOTADA: 'Lotada', ENCERRADA: 'Encerrada', FINALIZADA: 'Finalizada', CANCELADA: 'Cancelada', EXCLUIDA: 'Excluída' }[partida.status]} /></div><p>Atualize o local, categoria e horário.</p></div>{partida.status === 'RASCUNHO' && <button type="button" className="admin-button admin-button-primary" disabled={abertura.isPending || edicao.isPending || alteracoesPendentes} onClick={() => abertura.mutate()}>{abertura.isPending ? 'Abrindo inscrições…' : 'Abrir inscrições'}</button>}</header><div className="admin-form-fields admin-form-fields-two"><label>Modalidade<input value={partida.modalidade} disabled /><span>Não pode ser alterada</span></label><label>Capacidade<input value={`${partida.capacidade} jogadores`} disabled /><span>Não pode ser alterada</span></label><label>Local<select required value={localId} onChange={(evento) => setLocalId(evento.target.value)}>{locais.data?.filter(item => item.modalidadeIds?.includes(partida.modalidadeId ?? '')).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label><label>Categoria<select value={categoriaId} onChange={(evento) => setCategoriaId(evento.target.value)}><option value="">Todas as categorias</option>{categorias.data?.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select><span>Opcional</span></label><label>Duração prevista (minutos)<input type="number" required min="1" max="1440" step="1" value={duracao} onChange={e=>setDuracao(e.target.value)}/></label><div className="admin-form-field-full"><CampoDataHora titulo="Data e horário do clube" valor={paraDataLocal(inicio)} aoAlterar={valor => setInicio(valor ? `${valor}:00-03:00` : '')} /></div></div>{abertura.isError && <div className="admin-inline-error" role="alert"><span>{abertura.error instanceof ApiError ? abertura.error.detail : 'Não foi possível abrir as inscrições. Tente novamente.'}</span></div>}</section><section className="admin-form-card"><header><h2>Período de inscrições</h2><p>Atualize a abertura e o encerramento das inscrições.</p></header><div className="admin-form-fields admin-form-fields-two"><CampoDataHora titulo="Início das inscrições" descricao="Opcional" valor={inscricoesAbremEm} aoAlterar={setInscricoesAbremEm} /><CampoDataHora titulo="Encerramento das inscrições" descricao="Opcional" min={inscricoesAbremEm || undefined} valor={inscricoesEncerramEm} aoAlterar={setInscricoesEncerramEm} />{periodoInvalido && <p className="admin-form-error admin-form-field-full" role="alert">O encerramento deve ser posterior ao início das inscrições.</p>}</div></section>{edicao.isError && <div className="admin-inline-error" role="alert"><span>{mensagemDeErro(edicao.error)}</span></div>}<section className="admin-form-card"><header><h2>Jogadores inscritos</h2><p>{inscritos.data?.length ?? 0} jogadores vinculados a esta partida.</p></header><div className="admin-edit-participants">{inscritos.isPending && <div className="admin-table-skeleton"><span /><span /></div>}{inscritos.isError && <p>Não foi possível carregar os inscritos.</p>}{inscritos.data?.map((item) => <div key={item.inscricaoId}><span>{iniciais(item.nome)}</span><div><strong>{item.nome}</strong><small>{item.categoria ?? 'Categoria não informada'}</small></div><b>{item.status}</b></div>)}</div></section></div>
      <aside className="admin-create-side"><section className="admin-form-card"><header><h2>Resumo da partida</h2></header><div className="admin-match-draft-summary"><span><CalendarDays aria-hidden="true" /><b>{partida.modalidade}</b></span><span><MapPin aria-hidden="true" />{locais.data?.find((item) => item.id === localId)?.nome ?? partida.local}</span><span><CalendarDays aria-hidden="true" />{formatoData.format(new Date(inicio || partida.inicio))}</span><span><UsersRound aria-hidden="true" />{partida.quantidadeInscritos ?? 0} de {partida.capacidade} inscritos · {duracao} min</span></div></section><section className="admin-form-card"><header><h2>Arbitragem</h2></header><div className="admin-match-draft-summary"><span><ShieldCheck aria-hidden="true" /><b>{rotuloArbitragem(partida)}</b></span><span><UsersRound aria-hidden="true" />Placar: {partida.arbitragem.golsAmarelo} × {partida.arbitragem.golsAzul}</span><span><ShieldCheck aria-hidden="true" />{partida.arbitragem.totalPunicoes} infrações registradas</span></div></section>
        {(partida.status === 'RASCUNHO' || partida.status === 'ABERTA' || partida.status === 'LOTADA') && <section className="admin-form-card admin-match-actions-card">
          <header><h2>Cancelar Partida</h2><p>Cancele a partida quando ela não puder mais acontecer.</p></header>
          <div className="admin-match-actions">
            <Confirmacao acionador={<button type="button" className="admin-button admin-button-danger">Cancelar partida</button>} titulo="Cancelar esta partida?" descricao="A partida será marcada como Cancelada e todas as inscrições ativas também serão canceladas." rotuloConfirmacao="Cancelar partida" processando={cancelamento.isPending} aoConfirmar={() => cancelamento.mutate()} />
            {cancelamento.isError && <p className="admin-sheet-error" role="alert">{mensagemDeErro(cancelamento.error)}</p>}
          </div>
        </section>}
        {partida.status === 'RASCUNHO' && <section className="admin-form-card admin-match-actions-card admin-match-delete-card">
          <header><h2>Excluir partida</h2><p>Exclua um cadastro criado por engano. A partida permanecerá no histórico.</p></header>
          <div className="admin-match-actions">
            <Confirmacao acionador={<button type="button" className="admin-button admin-button-danger-solid"><Trash2 aria-hidden="true" />Excluir partida</button>} titulo="Excluir esta partida?" descricao="Ela deixará de aceitar alterações e permanecerá no histórico com o status Excluída." rotuloConfirmacao="Excluir partida" processando={exclusao.isPending} aoConfirmar={() => exclusao.mutate()} />
            {exclusao.isError && <p className="admin-sheet-error" role="alert">{mensagemDeErro(exclusao.error)}</p>}
          </div>
        </section>}
      </aside>
    </form>
  </section>;
}

function paraDataLocal(valor: string | null) {
  if (!valor) return '';
  const data = new Date(valor);
  const deslocamento = data.getTimezoneOffset() * 60_000;
  return new Date(data.getTime() - deslocamento).toISOString().slice(0, 16);
}

function iniciais(nome: string) {
  return nome.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
}

function rotuloArbitragem(partida: Partida) {
  return { PREPARACAO: 'Não iniciada', EM_ANDAMENTO: 'Em andamento', PAUSADA: 'Pausada', FINALIZADA: 'Finalizada' }[partida.arbitragem.status];
}
