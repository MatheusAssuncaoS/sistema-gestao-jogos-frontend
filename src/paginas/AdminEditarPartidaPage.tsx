import { useAuth } from '../contexto/useAuth';
import { pode } from '../seguranca/permissoes';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Check, MapPin, ShieldCheck, Trash2, UsersRound } from 'lucide-react';
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
const formatoHex = /^#[0-9A-F]{6}$/;
const opcoesCores = [
  { nome: 'Azul e amarelo', nomes: ['Azul', 'Amarelo'], cores: ['#2563EB', '#FACC15'] },
  { nome: 'Vermelho e branco', nomes: ['Vermelho', 'Branco'], cores: ['#DC2626', '#F8FAFC'] },
  { nome: 'Verde e preto', nomes: ['Verde', 'Preto'], cores: ['#16A34A', '#111827'] },
  { nome: 'Laranja e roxo', nomes: ['Laranja', 'Roxo'], cores: ['#F97316', '#7E22CE'] },
  { nome: 'Rosa e cinza', nomes: ['Rosa', 'Cinza'], cores: ['#EC4899', '#64748B'] },
] as const;

function mensagemDeErro(falha: unknown) {
  return falha instanceof ApiError ? falha.detail : 'Não foi possível salvar a partida. Tente novamente.';
}

export function AdminEditarPartidaPage() {
  const { usuario: operador } = useAuth();
  const { partidaId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const partidas = useQuery({ queryKey: ['partidas', 'gestao'], queryFn: organizadorPartidaService.listar });
  const locais = useQuery({ queryKey: ['partidas', 'locais'], queryFn: organizadorPartidaService.listarLocais });
  const categorias = useQuery({ queryKey: ['partidas', 'categorias'], queryFn: organizadorPartidaService.listarCategorias });
  const [aviso, setAviso] = useState<{ mensagem: string; tipo: 'sucesso' | 'erro' } | null>(null);
  const [localId, setLocalId] = useState('');
  const inscritos = useQuery({ queryKey: ['partidas', partidaId, 'inscritos'], queryFn: () => organizadorPartidaService.listarInscritos(partidaId), enabled: partidaId !== '' && pode(operador, 'PARTIDAS_INSCRITOS') });
  const partida = partidas.data?.find((item) => item.id === partidaId);
  const [categoriaId, setCategoriaId] = useState('');
  const [duracao, setDuracao] = useState('60');
  const duracaoValida = Number.isInteger(Number(duracao)) && Number(duracao) >= 1 && Number(duracao) <= 1440;
  const [inicio, setInicio] = useState('');
  const [inscricoesAbremEm, setInscricoesAbremEm] = useState('');
  const [inscricoesEncerramEm, setInscricoesEncerramEm] = useState('');
  const [corEquipeAzul, setCorEquipeAzul] = useState('#2563EB');
  const [corEquipeAmarela, setCorEquipeAmarela] = useState('#FACC15');
  const [nomeEquipeAzul, setNomeEquipeAzul] = useState('Azul');
  const [nomeEquipeAmarela, setNomeEquipeAmarela] = useState('Amarelo');
  const [coresPersonalizadas, setCoresPersonalizadas] = useState(false);

  useEffect(() => {
    if (!partida) return;
    setLocalId(locais.data?.find((item) => item.nome === partida.local)?.id ?? '');
    setCategoriaId(String(categorias.data?.find((item) => item.nome === partida.categoria)?.id ?? ''));
    setInicio(partida.inicio);
    setDuracao(String(partida.duracaoMinutos ?? 60));
    setInscricoesAbremEm(paraDataLocal(partida.inscricoesAbremEm));
    setInscricoesEncerramEm(paraDataLocal(partida.inscricoesEncerramEm));
    const equipeAzul = partida.equipes.find(equipe => equipe.cor === 'AZUL');
    const equipeAmarela = partida.equipes.find(equipe => equipe.cor === 'AMARELO');
    setCorEquipeAzul(equipeAzul?.corHex ?? '#2563EB');
    setCorEquipeAmarela(equipeAmarela?.corHex ?? '#FACC15');
    setNomeEquipeAzul(equipeAzul?.nome ?? 'Azul');
    setNomeEquipeAmarela(equipeAmarela?.nome ?? 'Amarelo');
    setCoresPersonalizadas(!opcoesCores.some(opcao => opcao.cores[0] === (equipeAzul?.corHex ?? '#2563EB') && opcao.cores[1] === (equipeAmarela?.corHex ?? '#FACC15')));
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
      corEquipeAzul,
      corEquipeAmarela,
      nomeEquipeAzul: nomeEquipeAzul.trim(),
      nomeEquipeAmarela: nomeEquipeAmarela.trim(),
      versao: partida!.versao,
    }),
    onMutate: () => setAviso(null),
    onSuccess: async (atualizada) => {
      queryClient.setQueryData<Partida[]>(['partidas', 'gestao'], atuais => atuais?.map(item => item.id === atualizada.id ? atualizada : item));
      await queryClient.invalidateQueries({ queryKey: ['partidas'] });
      navigate('/admin/partidas', { replace: true, state: { aviso: 'Dados da partida salvos com sucesso.' } });
    },
    onError: falha => setAviso({ mensagem: mensagemDeErro(falha), tipo: 'erro' }),
  });

  const abertura = useMutation({
    mutationFn: () => organizadorPartidaService.abrir(partidaId),
    onSuccess: async (atualizada) => {
      queryClient.setQueryData<Partida[]>(['partidas', 'gestao'], atuais => atuais?.map(item => item.id === atualizada.id ? atualizada : item));
      setAviso({ mensagem: 'Partida aberta para inscrições.', tipo: 'sucesso' });
      await queryClient.invalidateQueries({ queryKey: ['partidas'] });
    },
  });
  const concluirStatus = async (atualizada: Partida, mensagem: string) => {
    queryClient.setQueryData<Partida[]>(['partidas', 'gestao'], atuais => atuais?.map(item => item.id === atualizada.id ? atualizada : item));
    setAviso({ mensagem, tipo: 'sucesso' });
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
    || corEquipeAzul !== (partida.equipes.find(equipe => equipe.cor === 'AZUL')?.corHex ?? '#2563EB')
    || corEquipeAmarela !== (partida.equipes.find(equipe => equipe.cor === 'AMARELO')?.corHex ?? '#FACC15')
    || nomeEquipeAzul !== (partida.equipes.find(equipe => equipe.cor === 'AZUL')?.nome ?? 'Azul')
    || nomeEquipeAmarela !== (partida.equipes.find(equipe => equipe.cor === 'AMARELO')?.nome ?? 'Amarelo')
  ));

  function submeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pode(operador, 'PARTIDAS_EDITAR') && partida && localId && inicio && duracaoValida && !periodoInvalido && formatoHex.test(corEquipeAzul) && formatoHex.test(corEquipeAmarela) && corEquipeAzul !== corEquipeAmarela && nomeEquipeAzul.trim() && nomeEquipeAmarela.trim()) edicao.mutate();
  }

  const carregando = partidas.isPending || locais.isPending || categorias.isPending;
  if (carregando) return <div className="admin-table-skeleton" aria-label="Carregando partida"><span /><span /><span /><span /></div>;
  if (partidas.isError || locais.isError || categorias.isError) return <div className="admin-inline-error" role="alert"><span>Não foi possível carregar os dados da partida.</span><button type="button" onClick={() => { void partidas.refetch(); void locais.refetch(); void categorias.refetch(); }}>Tentar novamente</button></div>;
  if (!partida) return <div className="admin-empty-state"><h3>Partida não encontrada</h3><p>Ela pode ter sido removida ou não está mais disponível.</p><button className="admin-button admin-button-secondary" onClick={() => navigate('/admin/partidas')}>Voltar para partidas</button></div>;

  const equipesValidas = formatoHex.test(corEquipeAzul) && formatoHex.test(corEquipeAmarela)
    && corEquipeAzul !== corEquipeAmarela && Boolean(nomeEquipeAzul.trim() && nomeEquipeAmarela.trim());
  const editorEquipes = <section className="admin-team-configurator admin-form-card"><header><h3>Times e cores dos coletes</h3><p>Atualize as cores e os nomes usados nesta partida.</p></header><div className="admin-team-color-presets">{opcoesCores.map(opcao => { const selecionada = !coresPersonalizadas && opcao.cores[0] === corEquipeAzul && opcao.cores[1] === corEquipeAmarela; return <button key={opcao.nome} type="button" aria-pressed={selecionada} className={selecionada ? 'selected' : ''} onClick={() => { setCoresPersonalizadas(false); setCorEquipeAzul(opcao.cores[0]); setCorEquipeAmarela(opcao.cores[1]); setNomeEquipeAzul(opcao.nomes[0]); setNomeEquipeAmarela(opcao.nomes[1]); }}><span><i style={{ backgroundColor: opcao.cores[0] }} /><i style={{ backgroundColor: opcao.cores[1] }} /></span><strong>{opcao.nome}</strong>{selecionada && <Check />}</button>; })}<button type="button" aria-pressed={coresPersonalizadas} className={coresPersonalizadas ? 'selected custom' : 'custom'} onClick={() => { setCoresPersonalizadas(true); setNomeEquipeAzul('Time 1'); setNomeEquipeAmarela('Time 2'); }}><span className="admin-custom-color-square" style={{ background: `linear-gradient(135deg, ${corEquipeAzul} 0 50%, ${corEquipeAmarela} 50% 100%)` }} /><strong>Personalizadas</strong>{coresPersonalizadas && <Check />}</button></div><div className="admin-team-names"><label>Nome do time 1<input type="text" required maxLength={50} value={nomeEquipeAzul} onChange={evento => setNomeEquipeAzul(evento.target.value)} /></label><label>Nome do time 2<input type="text" required maxLength={50} value={nomeEquipeAmarela} onChange={evento => setNomeEquipeAmarela(evento.target.value)} /></label></div><div className="admin-team-custom-colors"><CorEquipe titulo={nomeEquipeAzul || 'Time 1'} valor={corEquipeAzul} aoAlterar={valor => { setCoresPersonalizadas(true); setCorEquipeAzul(valor); }} /><CorEquipe titulo={nomeEquipeAmarela || 'Time 2'} valor={corEquipeAmarela} aoAlterar={valor => { setCoresPersonalizadas(true); setCorEquipeAmarela(valor); }} /></div>{!equipesValidas && <p className="admin-form-error" role="alert">Informe nomes e cores HEX válidas e diferentes.</p>}</section>;

  return <section className="admin-create-match" aria-labelledby="titulo-editar-partida">
    <header className="admin-create-heading"><div><button type="button" aria-label="Voltar para partidas" onClick={() => navigate('/admin/partidas')}><ArrowLeft aria-hidden="true" /></button><div><h1 id="titulo-editar-partida">Editar partida</h1><p>{partida.modalidade} · {formatoData.format(new Date(partida.inicio))}</p></div></div><div><button type="submit" form="form-editar-partida" className="admin-button admin-button-primary" disabled={!pode(operador, 'PARTIDAS_EDITAR') || !['RASCUNHO', 'ABERTA'].includes(partida.status) || abertura.isPending || edicao.isPending || !localId || !inicio || !duracaoValida || periodoInvalido || !equipesValidas}>{edicao.isPending ? 'Salvando…' : 'Salvar alterações'}</button></div></header>
    {aviso && <AvisoTemporario mensagem={aviso.mensagem} tipo={aviso.tipo} aoFechar={() => setAviso(null)} />}
    <form id="form-editar-partida" className="admin-create-grid" onSubmit={submeter}>
      <div className="admin-create-main"><section className="admin-form-card"><header className="admin-match-details-header"><div><div className="admin-registration-title"><h2>Detalhes da partida</h2><StatusBadge status={partida.status} rotulo={{ RASCUNHO: 'Rascunho', ABERTA: 'Aberta', LOTADA: 'Lotada', ENCERRADA: 'Encerrada', FINALIZADA: 'Finalizada', CANCELADA: 'Cancelada', EXCLUIDA: 'Excluída' }[partida.status]} /></div><p>Atualize o local, categoria e horário.</p></div>{pode(operador, 'PARTIDAS_ABRIR') && partida.status === 'RASCUNHO' && <button type="button" className="admin-button admin-button-primary" disabled={abertura.isPending || edicao.isPending || alteracoesPendentes} onClick={() => abertura.mutate()}>{abertura.isPending ? 'Abrindo inscrições…' : 'Abrir inscrições'}</button>}</header><div className="admin-form-fields admin-form-fields-two"><label>Modalidade<input value={partida.modalidade} disabled /><span>Não pode ser alterada</span></label><label>Capacidade<input value={`${partida.capacidade} jogadores`} disabled /><span>Não pode ser alterada</span></label><label>Local<select required value={localId} onChange={(evento) => setLocalId(evento.target.value)}>{locais.data?.filter(item => item.modalidadeIds?.includes(partida.modalidadeId ?? '')).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label><label>Categoria<select value={categoriaId} onChange={(evento) => setCategoriaId(evento.target.value)}><option value="">Todas as categorias</option>{categorias.data?.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select><span>Opcional</span></label><label>Duração prevista (minutos)<input type="number" required min="1" max="1440" step="1" value={duracao} onChange={e=>setDuracao(e.target.value)}/></label><div className="admin-form-field-full"><CampoDataHora titulo="Data e horário do clube" valor={paraDataLocal(inicio)} aoAlterar={valor => setInicio(valor ? `${valor}:00-03:00` : '')} /></div></div>{abertura.isError && <div className="admin-inline-error" role="alert"><span>{abertura.error instanceof ApiError ? abertura.error.detail : 'Não foi possível abrir as inscrições. Tente novamente.'}</span></div>}</section>{editorEquipes}<section className="admin-form-card"><header><h2>Período de inscrições</h2><p>Atualize a abertura e o encerramento das inscrições.</p></header><div className="admin-form-fields admin-form-fields-two"><CampoDataHora titulo="Início das inscrições" descricao="Opcional" valor={inscricoesAbremEm} aoAlterar={setInscricoesAbremEm} /><CampoDataHora titulo="Encerramento das inscrições" descricao="Opcional" min={inscricoesAbremEm || undefined} valor={inscricoesEncerramEm} aoAlterar={setInscricoesEncerramEm} />{periodoInvalido && <p className="admin-form-error admin-form-field-full" role="alert">O encerramento deve ser posterior ao início das inscrições.</p>}</div></section>{pode(operador, 'PARTIDAS_INSCRITOS') && <section className="admin-form-card"><header><h2>Jogadores inscritos</h2><p>{inscritos.data?.length ?? 0} jogadores vinculados a esta partida.</p></header><div className="admin-edit-participants">{inscritos.isPending && <div className="admin-table-skeleton"><span /><span /></div>}{inscritos.isError && <p>Não foi possível carregar os inscritos.</p>}{inscritos.data?.map((item) => <div key={item.inscricaoId}><span>{iniciais(item.nome)}</span><div><strong>{item.nome}</strong><small>{item.categoria ?? 'Categoria não informada'}</small></div><b>{item.status}</b></div>)}</div></section>}</div>
      <aside className="admin-create-side"><section className="admin-form-card"><header><h2>Resumo da partida</h2></header><div className="admin-match-draft-summary"><span><CalendarDays aria-hidden="true" /><b>{partida.modalidade}</b></span><span><MapPin aria-hidden="true" />{locais.data?.find((item) => item.id === localId)?.nome ?? partida.local}</span><span><CalendarDays aria-hidden="true" />{formatoData.format(new Date(inicio || partida.inicio))}</span><span><UsersRound aria-hidden="true" />{partida.quantidadeInscritos ?? 0} de {partida.capacidade} inscritos · {duracao} min</span></div></section><section className="admin-form-card"><header><h2>Arbitragem</h2></header><div className="admin-match-draft-summary"><span><ShieldCheck aria-hidden="true" /><b>{rotuloArbitragem(partida)}</b></span><span><UsersRound aria-hidden="true" />Placar: {partida.arbitragem.golsAmarelo} × {partida.arbitragem.golsAzul}</span><span><ShieldCheck aria-hidden="true" />{partida.arbitragem.totalPunicoes} infrações registradas</span></div></section>
        {pode(operador, 'PARTIDAS_CANCELAR') && (partida.status === 'RASCUNHO' || partida.status === 'ABERTA' || partida.status === 'LOTADA') && <section className="admin-form-card admin-match-actions-card">
          <header><h2>Cancelar Partida</h2><p>Cancele a partida quando ela não puder mais acontecer.</p></header>
          <div className="admin-match-actions">
            <Confirmacao acionador={<button type="button" className="admin-button admin-button-danger">Cancelar partida</button>} titulo="Cancelar esta partida?" descricao="A partida será marcada como Cancelada e todas as inscrições ativas também serão canceladas." rotuloConfirmacao="Cancelar partida" processando={cancelamento.isPending} aoConfirmar={() => cancelamento.mutate()} />
            {cancelamento.isError && <p className="admin-sheet-error" role="alert">{mensagemDeErro(cancelamento.error)}</p>}
          </div>
        </section>}
        {pode(operador, 'PARTIDAS_EXCLUIR') && partida.status === 'RASCUNHO' && <section className="admin-form-card admin-match-actions-card admin-match-delete-card">
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

function CorEquipe({ titulo, valor, aoAlterar }: { titulo: string; valor: string; aoAlterar: (valor: string) => void }) {
  const corDoSeletor = formatoHex.test(valor) ? valor : '#000000';
  return <label><span>{titulo}</span><div><input type="color" aria-label={`Selecionar cor do ${titulo}`} value={corDoSeletor} onChange={evento => aoAlterar(evento.target.value.toUpperCase())} /><input type="text" aria-label={`Cor HEX do ${titulo}`} value={valor} maxLength={7} placeholder="#000000" onChange={evento => aoAlterar(evento.target.value.toUpperCase())} /></div></label>;
}

function rotuloArbitragem(partida: Partida) {
  return { PREPARACAO: 'Não iniciada', EM_ANDAMENTO: 'Em andamento', PAUSADA: 'Pausada', FINALIZADA: 'Finalizada' }[partida.arbitragem.status];
}
