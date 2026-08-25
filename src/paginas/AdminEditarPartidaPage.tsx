import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, MapPin, ShieldCheck, UsersRound } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { ApiError } from '../servicos/api';
import { calendarioService } from '../servicos/calendarioService';
import { organizadorPartidaService } from '../servicos/organizadorPartidaService';
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
  const horarios = useQuery({ queryKey: ['calendario', 'horarios-disponiveis', 730], queryFn: () => calendarioService.listarHorariosDisponiveis(730) });
  const inscritos = useQuery({ queryKey: ['partidas', partidaId, 'inscritos'], queryFn: () => organizadorPartidaService.listarInscritos(partidaId), enabled: partidaId !== '' });
  const partida = partidas.data?.find((item) => item.id === partidaId);
  const [localId, setLocalId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [inicio, setInicio] = useState('');
  const [inscricoesAbremEm, setInscricoesAbremEm] = useState('');
  const [inscricoesEncerramEm, setInscricoesEncerramEm] = useState('');

  useEffect(() => {
    if (!partida) return;
    setLocalId(locais.data?.find((item) => item.nome === partida.local)?.id ?? '');
    setCategoriaId(String(categorias.data?.find((item) => item.nome === partida.categoria)?.id ?? ''));
    setInicio(partida.inicio);
    setInscricoesAbremEm(paraDataLocal(partida.inscricoesAbremEm));
    setInscricoesEncerramEm(paraDataLocal(partida.inscricoesEncerramEm));
  }, [partida, locais.data, categorias.data]);

  const opcoesHorario = useMemo(() => [...new Set([partida?.inicio, ...(horarios.data ?? [])].filter((item): item is string => Boolean(item)))].sort(), [partida?.inicio, horarios.data]);
  const periodoInvalido = inscricoesAbremEm !== '' && inscricoesEncerramEm !== '' && new Date(inscricoesAbremEm).getTime() >= new Date(inscricoesEncerramEm).getTime();
  const edicao = useMutation({
    mutationFn: () => organizadorPartidaService.editar(partidaId, {
      localId,
      categoriaId: categoriaId ? Number(categoriaId) : undefined,
      inicio,
      inscricoesAbremEm: inscricoesAbremEm ? new Date(inscricoesAbremEm).toISOString() : undefined,
      inscricoesEncerramEm: inscricoesEncerramEm ? new Date(inscricoesEncerramEm).toISOString() : undefined,
      versao: partida!.versao,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['partidas', 'gestao'] });
      navigate('/admin/partidas', { replace: true });
    },
  });

  function submeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (partida && localId && inicio && !periodoInvalido) edicao.mutate();
  }

  const carregando = partidas.isPending || locais.isPending || categorias.isPending || horarios.isPending;
  if (carregando) return <div className="admin-table-skeleton" aria-label="Carregando partida"><span /><span /><span /><span /></div>;
  if (partidas.isError || locais.isError || categorias.isError || horarios.isError) return <div className="admin-inline-error" role="alert"><span>Não foi possível carregar os dados da partida.</span><button type="button" onClick={() => { void partidas.refetch(); void locais.refetch(); void categorias.refetch(); void horarios.refetch(); }}>Tentar novamente</button></div>;
  if (!partida) return <div className="admin-empty-state"><h3>Partida não encontrada</h3><p>Ela pode ter sido removida ou não está mais disponível.</p><button className="admin-button admin-button-secondary" onClick={() => navigate('/admin/partidas')}>Voltar para partidas</button></div>;

  return <section className="admin-create-match" aria-labelledby="titulo-editar-partida">
    <header className="admin-create-heading"><div><button type="button" aria-label="Voltar para partidas" onClick={() => navigate('/admin/partidas')}><ArrowLeft aria-hidden="true" /></button><div><h1 id="titulo-editar-partida">Editar partida</h1><p>{partida.modalidade} · {formatoData.format(new Date(partida.inicio))}</p></div></div><div><button type="button" className="admin-button admin-button-secondary" disabled={edicao.isPending} onClick={() => navigate('/admin/partidas')}>Cancelar</button><button type="submit" form="form-editar-partida" className="admin-button admin-button-primary" disabled={edicao.isPending || !localId || !inicio || periodoInvalido}>{edicao.isPending ? 'Salvando…' : 'Salvar alterações'}</button></div></header>
    <form id="form-editar-partida" className="admin-create-grid" onSubmit={submeter}>
      <div className="admin-create-main"><section className="admin-form-card"><header><h2>Detalhes da partida</h2><p>Atualize o local, categoria e horário.</p></header><div className="admin-form-fields admin-form-fields-two"><label>Modalidade <span>Não pode ser alterada</span><input value={partida.modalidade} disabled /></label><label>Capacidade <span>Não pode ser alterada</span><input value={`${partida.capacidade} jogadores`} disabled /></label><label>Local<select required value={localId} onChange={(evento) => setLocalId(evento.target.value)}>{locais.data?.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label><label>Categoria <span>Opcional</span><select value={categoriaId} onChange={(evento) => setCategoriaId(evento.target.value)}><option value="">Todas as categorias</option>{categorias.data?.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label><label className="admin-form-field-full">Data e horário<select required value={inicio} onChange={(evento) => setInicio(evento.target.value)}>{opcoesHorario.map((horario) => <option key={horario} value={horario}>{formatoData.format(new Date(horario))}</option>)}</select></label></div></section><section className="admin-form-card"><header><h2>Período de inscrições</h2><p>Atualize a abertura e o encerramento das inscrições.</p></header><div className="admin-form-fields admin-form-fields-two"><label>Início das inscrições <span>Opcional</span><input type="datetime-local" value={inscricoesAbremEm} onChange={(evento) => setInscricoesAbremEm(evento.target.value)} /></label><label>Encerramento das inscrições <span>Opcional</span><input type="datetime-local" min={inscricoesAbremEm || undefined} value={inscricoesEncerramEm} onChange={(evento) => setInscricoesEncerramEm(evento.target.value)} /></label>{periodoInvalido && <p className="admin-form-error admin-form-field-full" role="alert">O encerramento deve ser posterior ao início das inscrições.</p>}</div></section>{edicao.isError && <div className="admin-inline-error" role="alert"><span>{mensagemDeErro(edicao.error)}</span></div>}<section className="admin-form-card"><header><h2>Jogadores inscritos</h2><p>{inscritos.data?.length ?? 0} jogadores vinculados a esta partida.</p></header><div className="admin-edit-participants">{inscritos.isPending && <div className="admin-table-skeleton"><span /><span /></div>}{inscritos.isError && <p>Não foi possível carregar os inscritos.</p>}{inscritos.data?.map((item) => <div key={item.inscricaoId}><span>{iniciais(item.nome)}</span><div><strong>{item.nome}</strong><small>{item.categoria ?? 'Categoria não informada'}</small></div><b>{item.status}</b></div>)}</div></section></div>
      <aside className="admin-create-side"><section className="admin-form-card"><header><h2>Resumo da partida</h2></header><div className="admin-match-draft-summary"><span><CalendarDays aria-hidden="true" /><b>{partida.modalidade}</b></span><span><MapPin aria-hidden="true" />{locais.data?.find((item) => item.id === localId)?.nome ?? partida.local}</span><span><CalendarDays aria-hidden="true" />{formatoData.format(new Date(inicio))}</span><span><UsersRound aria-hidden="true" />{partida.quantidadeInscritos ?? 0} de {partida.capacidade} inscritos</span></div></section><section className="admin-form-card"><header><h2>Arbitragem</h2></header><div className="admin-match-draft-summary"><span><ShieldCheck aria-hidden="true" /><b>{rotuloArbitragem(partida)}</b></span><span><UsersRound aria-hidden="true" />Placar: {partida.arbitragem.golsAmarelo} × {partida.arbitragem.golsAzul}</span><span><ShieldCheck aria-hidden="true" />{partida.arbitragem.totalPunicoes} infrações registradas</span></div></section></aside>
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
