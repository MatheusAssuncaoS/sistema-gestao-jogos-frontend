import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState, type FormEvent } from 'react';

import { ApiError } from '../../servicos/api';
import { organizadorPartidaService } from '../../servicos/organizadorPartidaService';
import type { Partida } from '../../servicos/tipos';
import { Sheet } from '../ui/painel-lateral';

interface CriarPartidaSheetProps {
  aberto: boolean;
  aoAlterar: (aberto: boolean) => void;
  aoCriar: (partida: Partida) => void;
}


function mensagemDeErro(falha: unknown) {
  return falha instanceof ApiError ? falha.detail : 'Não foi possível criar a partida. Tente novamente.';
}

export function CriarPartidaSheet({ aberto, aoAlterar, aoCriar }: CriarPartidaSheetProps) {
  const [modalidadeId, setModalidadeId] = useState('');
  const [localId, setLocalId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [inicio, setInicio] = useState('');
  const [capacidade, setCapacidade] = useState('');
  const [duracao, setDuracao] = useState('60');
  const [inscricoesAbremEm, setInscricoesAbremEm] = useState('');
  const [inscricoesEncerramEm, setInscricoesEncerramEm] = useState('');

  const modalidades = useQuery({
    queryKey: ['partidas', 'modalidades'],
    queryFn: organizadorPartidaService.listarModalidades,
    enabled: aberto,
  });
  const locais = useQuery({
    queryKey: ['partidas', 'locais'],
    queryFn: organizadorPartidaService.listarLocais,
    enabled: aberto,
  });
  const categorias = useQuery({
    queryKey: ['partidas', 'categorias'],
    queryFn: organizadorPartidaService.listarCategorias,
    enabled: aberto,
  });
  const criacao = useMutation({
    mutationFn: organizadorPartidaService.criar,
    onSuccess: (partida) => {
      aoCriar(partida);
      aoAlterar(false);
    },
  });

  useEffect(() => {
    if (!aberto) {
      setModalidadeId('');
      setLocalId('');
      setCategoriaId('');
      setInicio('');
      setCapacidade('');
      setDuracao('60');
      setInscricoesAbremEm('');
      setInscricoesEncerramEm('');
      criacao.reset();
    }
  // A mutação é estável durante a vida do componente e não deve reiniciar o formulário a cada renderização.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  const carregando = modalidades.isPending || locais.isPending || categorias.isPending;
  const falhaAoCarregar = modalidades.error ?? locais.error ?? categorias.error;
  const periodoInvalido = inscricoesAbremEm !== '' && inscricoesEncerramEm !== ''
    && new Date(inscricoesAbremEm).getTime() >= new Date(inscricoesEncerramEm).getTime();

  function submeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!modalidadeId || !localId || !inicio || periodoInvalido) return;

    criacao.mutate({
      duracaoMinutos: Number(duracao),
      modalidadeId,
      localId,
      categoriaId: categoriaId ? Number(categoriaId) : undefined,
      inicio: `${inicio}:00-03:00`,
      capacidade: capacidade ? Number(capacidade) : undefined,
      inscricoesAbremEm: inscricoesAbremEm ? new Date(inscricoesAbremEm).toISOString() : undefined,
      inscricoesEncerramEm: inscricoesEncerramEm ? new Date(inscricoesEncerramEm).toISOString() : undefined,
    });
  }

  return (
    <Sheet aberto={aberto} aoAlterar={aoAlterar} titulo="Nova partida" descricao="Preencha os dados para criar uma partida em rascunho.">
      {carregando && <div className="admin-table-skeleton" aria-label="Carregando dados da partida"><span /><span /><span /><span /></div>}
      {falhaAoCarregar && <div className="admin-inline-error" role="alert"><span>Não foi possível carregar os dados necessários.</span><button type="button" onClick={() => { void modalidades.refetch(); void locais.refetch(); void categorias.refetch(); }}>Tentar novamente</button></div>}
      {!carregando && !falhaAoCarregar && (
        <form className="admin-sheet-section admin-sheet-form" onSubmit={submeter}>
          <label>Modalidade<select required value={modalidadeId} onChange={(evento) => { setModalidadeId(evento.target.value); setLocalId(''); }}><option value="">Selecione uma modalidade</option>{modalidades.data?.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
          <label>Local<select required disabled={!modalidadeId} value={localId} onChange={(evento) => { setLocalId(evento.target.value); setInicio(''); }}><option value="">Selecione um local</option>{locais.data?.filter(l => l.modalidadeIds?.includes(modalidadeId)).map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
          <label>Categoria <span>Opcional</span><select value={categoriaId} onChange={(evento) => setCategoriaId(evento.target.value)}><option value="">Todas as categorias</option>{categorias.data?.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select></label>
          <label>Duração prevista (minutos)<input required type="number" min="1" max="1440" step="1" value={duracao} onChange={e=>setDuracao(e.target.value)}/></label><label>Data e horário do clube<input required type="datetime-local" value={inicio} onChange={e=>setInicio(e.target.value)}/></label>
          <label>Capacidade <span>Opcional; mínimo de 2 jogadores</span><input type="number" min="2" step="1" value={capacidade} onChange={(evento) => setCapacidade(evento.target.value)} placeholder="Ex.: 16" /></label>
          <label>Início das inscrições <span>Opcional</span><input type="datetime-local" value={inscricoesAbremEm} onChange={(evento) => setInscricoesAbremEm(evento.target.value)} /></label>
          <label>Encerramento das inscrições <span>Opcional</span><input type="datetime-local" min={inscricoesAbremEm || undefined} value={inscricoesEncerramEm} onChange={(evento) => setInscricoesEncerramEm(evento.target.value)} aria-invalid={periodoInvalido} aria-describedby={periodoInvalido ? 'erro-periodo-inscricoes' : undefined} /></label>
          {periodoInvalido && <p id="erro-periodo-inscricoes" className="admin-date-error" role="alert">O encerramento deve ser posterior ao início das inscrições.</p>}
          {criacao.isError && <div className="admin-inline-error" role="alert"><span>{mensagemDeErro(criacao.error)}</span></div>}
          <div className="admin-sheet-actions"><button type="button" className="admin-button admin-button-secondary" disabled={criacao.isPending} onClick={() => aoAlterar(false)}>Cancelar</button><button type="submit" className="admin-button admin-button-primary" disabled={criacao.isPending || !inicio || periodoInvalido}>{criacao.isPending ? 'Criando…' : 'Criar partida'}</button></div>
        </form>
      )}
    </Sheet>
  );
}
