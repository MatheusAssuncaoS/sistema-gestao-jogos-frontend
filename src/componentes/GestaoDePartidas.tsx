import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { ApiError } from '../servicos/api';
import { calendarioService } from '../servicos/calendarioService';
import {
  organizadorPartidaService,
  type DadosCriacaoPartida,
} from '../servicos/organizadorPartidaService';
import type {
  Categoria,
  Inscrito,
  LocalPartida,
  Modalidade,
  Partida,
  StatusInscricao,
  StatusPartida,
} from '../servicos/tipos';

interface Aviso {
  texto: string;
  tom: 'verde' | 'neutro';
}

const formatador = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function formatarData(valor: string) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? '' : formatador.format(data);
}

const ROTULO_STATUS: Record<StatusPartida, string> = {
  RASCUNHO: 'Rascunho',
  ABERTA: 'Aberta',
  LOTADA: 'Lotada',
  ENCERRADA: 'Encerrada',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
};

const ROTULO_STATUS_INSCRICAO: Record<StatusInscricao, string> = {
  CONFIRMADA: 'Confirmada',
  LISTA_ESPERA: 'Lista de espera',
  CANCELADA: 'Cancelada',
  PRESENTE: 'Presente',
  AUSENTE: 'Ausente',
};

function classeDoBadge(status: StatusPartida) {
  return `admin-badge admin-badge-${status.toLowerCase()}`;
}

function statusEncerrado(status: StatusPartida) {
  return status === 'ENCERRADA' || status === 'FINALIZADA' || status === 'CANCELADA';
}

function mensagemDeErro(falha: unknown): string {
  if (falha instanceof ApiError) {
    if (falha.status === 401) {
      return 'Sessão expirada. Entre novamente.';
    }
    return falha.detail;
  }
  return 'Não foi possível completar a operação. Tente novamente.';
}

interface GestaoDePartidasProps {
  /**
   * O administrador acompanha as partidas, mas não gerencia — o backend só
   * autoriza listar, detalhar e ver inscritos para ADMINISTRADOR, não
   * criar/abrir/cancelar. Nessa aba, esconde as ações e nem busca
   * modalidades/locais/categorias, que o admin não tem acesso e não usaria
   * (servem só para montar o formulário de criação).
   */
  somenteLeitura?: boolean;
}

/**
 * UC11: gestão de partidas pelo organizador.
 *
 * Criar exige escolher um horário dentre os disponíveis no calendário do
 * clube (RN06/RN07) em vez de um datetime livre: a maioria dos horários
 * fora dessa lista seria rejeitada pelo backend com 409. Abrir e cancelar
 * não precisam de formulário; cancelar pede confirmação porque tem efeito
 * colateral real — cancela as inscrições ativas da partida.
 */
export function GestaoDePartidas({ somenteLeitura = false }: GestaoDePartidasProps) {
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [locais, setLocais] = useState<LocalPartida[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [horarios, setHorarios] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [emAndamento, setEmAndamento] = useState<string | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [formularioAberto, setFormularioAberto] = useState(false);
  const [inscritosAbertos, setInscritosAbertos] = useState<string | null>(null);
  const [inscritos, setInscritos] = useState<Inscrito[]>([]);
  const [carregandoInscritos, setCarregandoInscritos] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      if (somenteLeitura) {
        setPartidas(await organizadorPartidaService.listar());
      } else {
        const [listaPartidas, listaModalidades, listaLocais, listaCategorias] = await Promise.all([
          organizadorPartidaService.listar(),
          organizadorPartidaService.listarModalidades(),
          organizadorPartidaService.listarLocais(),
          organizadorPartidaService.listarCategorias(),
        ]);
        setPartidas(listaPartidas);
        setModalidades(listaModalidades);
        setLocais(listaLocais);
        setCategorias(listaCategorias);
      }
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregando(false);
    }
  }, [somenteLeitura]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function abrirFormulario() {
    setFormularioAberto(true);
    setAviso(null);
    try {
      setHorarios(await calendarioService.listarHorariosDisponiveis());
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    }
  }

  async function criar(dados: DadosCriacaoPartida) {
    setEmAndamento('nova');
    setErro(null);
    try {
      await organizadorPartidaService.criar(dados);
      setPartidas(await organizadorPartidaService.listar());
      setFormularioAberto(false);
      setAviso({ texto: 'Partida criada em rascunho.', tom: 'verde' });
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEmAndamento(null);
    }
  }

  async function abrir(partida: Partida) {
    setEmAndamento(partida.id);
    setErro(null);
    try {
      await organizadorPartidaService.abrir(partida.id);
      setPartidas(await organizadorPartidaService.listar());
      setAviso({ texto: 'Partida aberta para inscrições.', tom: 'verde' });
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEmAndamento(null);
    }
  }

  async function cancelar(partida: Partida) {
    if (!window.confirm('Cancelar esta partida? As inscrições ativas também serão canceladas.')) {
      return;
    }

    setEmAndamento(partida.id);
    setErro(null);
    try {
      await organizadorPartidaService.cancelar(partida.id);
      setPartidas(await organizadorPartidaService.listar());
      setAviso({ texto: 'Partida cancelada.', tom: 'neutro' });
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEmAndamento(null);
    }
  }

  async function alternarInscritos(partida: Partida) {
    if (inscritosAbertos === partida.id) {
      setInscritosAbertos(null);
      return;
    }

    setInscritosAbertos(partida.id);
    setCarregandoInscritos(true);
    setErro(null);
    try {
      setInscritos(await organizadorPartidaService.listarInscritos(partida.id));
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregandoInscritos(false);
    }
  }

  return (
    <section id="partidas" aria-labelledby="titulo-partidas" className="admin-card">
      <header className="admin-card-header">
        <div>
          <h2 id="titulo-partidas">Gestão de partidas</h2>
          <p>
            {somenteLeitura
              ? 'Acompanhe as partidas agendadas e quem se inscreveu.'
              : 'Crie partidas, abra para inscrições e acompanhe quem se inscreveu.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={carregar}
            disabled={carregando}
            className="admin-button admin-button-secondary"
          >
            <span aria-hidden="true">↻</span> Atualizar
          </button>
          {!somenteLeitura && !formularioAberto && (
            <button
              type="button"
              onClick={abrirFormulario}
              disabled={carregando}
              className="admin-button admin-button-primary"
            >
              Nova partida
            </button>
          )}
        </div>
      </header>

      <p
        role="status"
        aria-live="polite"
        className={`mt-2 min-h-5 text-sm ${aviso?.tom === 'verde' ? 'text-green-700' : 'text-gray-700'}`}
      >
        {aviso?.texto}
      </p>

      {erro && (
        <p className="my-2 text-sm text-red-600">
          {erro}{' '}
          <button type="button" onClick={carregar} className="text-blue-600 hover:underline">
            Tentar de novo
          </button>
        </p>
      )}

      {!somenteLeitura && formularioAberto && (
        <FormularioDeCriacao
          modalidades={modalidades}
          locais={locais}
          categorias={categorias}
          horarios={horarios}
          enviando={emAndamento === 'nova'}
          aoConfirmar={criar}
          aoCancelar={() => setFormularioAberto(false)}
        />
      )}

      {carregando && <p className="text-gray-600">Carregando...</p>}

      {!carregando && !erro && partidas.length === 0 && (
        <p className="text-gray-600">Nenhuma partida agendada no momento.</p>
      )}

      {partidas.length > 0 && (
        <ul className="admin-record-list">
          {partidas.map((partida) => (
            <li key={partida.id} className="admin-record">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <strong className="text-base">
                    {partida.modalidade} · {partida.local}
                  </strong>
                  <div className="text-sm text-gray-600">{formatarData(partida.inicio)}</div>
                  <div className="text-sm text-gray-600">
                    {partida.categoria ? `${partida.categoria} · ` : ''}
                    Capacidade {partida.capacidade}
                  </div>
                  <span className={classeDoBadge(partida.status)}>
                    {ROTULO_STATUS[partida.status]}
                  </span>
                </div>

                <div className="flex gap-2">
                  {!somenteLeitura && partida.status === 'RASCUNHO' && (
                    <button
                      type="button"
                      onClick={() => abrir(partida)}
                      disabled={emAndamento !== null}
                      className="admin-button admin-button-success"
                    >
                      {emAndamento === partida.id ? 'Abrindo...' : 'Abrir inscrições'}
                    </button>
                  )}
                  {!somenteLeitura && !statusEncerrado(partida.status) && (
                    <button
                      type="button"
                      onClick={() => cancelar(partida)}
                      disabled={emAndamento !== null}
                      className="admin-button admin-button-danger"
                    >
                      {emAndamento === partida.id ? 'Cancelando...' : 'Cancelar'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => alternarInscritos(partida)}
                    className="admin-button admin-button-secondary"
                  >
                    {inscritosAbertos === partida.id ? 'Ocultar inscritos' : 'Ver inscritos'}
                  </button>
                </div>
              </div>

              {inscritosAbertos === partida.id && (
                <ListaDeInscritos
                  carregando={carregandoInscritos}
                  inscritos={inscritos}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ListaDeInscritos({
  carregando,
  inscritos,
}: {
  carregando: boolean;
  inscritos: Inscrito[];
}) {
  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      {carregando && <p className="text-sm text-gray-600">Carregando inscritos...</p>}

      {!carregando && inscritos.length === 0 && (
        <p className="text-sm text-gray-600">Ninguém inscrito ainda.</p>
      )}

      {inscritos.length > 0 && (
        <ul className="space-y-1">
          {inscritos.map((inscrito) => (
            <li key={inscrito.inscricaoId} className="text-sm text-gray-700">
              {inscrito.nome}
              {inscrito.categoria ? ` · ${inscrito.categoria}` : ''} —{' '}
              {ROTULO_STATUS_INSCRICAO[inscrito.status]}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface FormularioDeCriacaoProps {
  modalidades: Modalidade[];
  locais: LocalPartida[];
  categorias: Categoria[];
  horarios: string[];
  enviando: boolean;
  aoConfirmar: (dados: DadosCriacaoPartida) => void;
  aoCancelar: () => void;
}

function FormularioDeCriacao({
  modalidades,
  locais,
  categorias,
  horarios,
  enviando,
  aoConfirmar,
  aoCancelar,
}: FormularioDeCriacaoProps) {
  const [modalidadeId, setModalidadeId] = useState(modalidades[0]?.id ?? '');
  const [localId, setLocalId] = useState(locais[0]?.id ?? '');
  const [categoriaId, setCategoriaId] = useState<number | ''>('');
  const [inicio, setInicio] = useState('');
  const [capacidade, setCapacidade] = useState('');
  const [inscricoesAbremEm, setInscricoesAbremEm] = useState('');
  const [inscricoesEncerramEm, setInscricoesEncerramEm] = useState('');

  function submeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!modalidadeId || !localId || !inicio) return;

    aoConfirmar({
      modalidadeId,
      localId,
      categoriaId: categoriaId === '' ? undefined : categoriaId,
      inicio,
      capacidade: capacidade === '' ? undefined : Number(capacidade),
      inscricoesAbremEm: inscricoesAbremEm ? new Date(inscricoesAbremEm).toISOString() : undefined,
      inscricoesEncerramEm: inscricoesEncerramEm
        ? new Date(inscricoesEncerramEm).toISOString()
        : undefined,
    });
  }

  return (
    <form onSubmit={submeter} className="mt-4 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4">
      <label className="block">
        <span className="text-xs font-medium text-gray-700">Modalidade</span>
        <select
          value={modalidadeId}
          onChange={(evento) => setModalidadeId(evento.target.value)}
          required
          className="mt-1 block rounded border border-gray-300 px-2 py-1.5 text-sm"
        >
          <option value="" disabled>
            Selecione
          </option>
          {modalidades.map((modalidade) => (
            <option key={modalidade.id} value={modalidade.id}>
              {modalidade.nome}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-medium text-gray-700">Local</span>
        <select
          value={localId}
          onChange={(evento) => setLocalId(evento.target.value)}
          required
          className="mt-1 block rounded border border-gray-300 px-2 py-1.5 text-sm"
        >
          <option value="" disabled>
            Selecione
          </option>
          {locais.map((local) => (
            <option key={local.id} value={local.id}>
              {local.nome}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-medium text-gray-700">Categoria (opcional)</span>
        <select
          value={categoriaId}
          onChange={(evento) =>
            setCategoriaId(evento.target.value === '' ? '' : Number(evento.target.value))
          }
          className="mt-1 block rounded border border-gray-300 px-2 py-1.5 text-sm"
        >
          <option value="">Nenhuma</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-medium text-gray-700">Horário</span>
        <select
          value={inicio}
          onChange={(evento) => setInicio(evento.target.value)}
          required
          className="mt-1 block rounded border border-gray-300 px-2 py-1.5 text-sm"
        >
          <option value="" disabled>
            {horarios.length === 0 ? 'Nenhum horário disponível' : 'Selecione'}
          </option>
          {horarios.map((horario) => (
            <option key={horario} value={horario}>
              {formatarData(horario)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-medium text-gray-700">Capacidade (opcional)</span>
        <input
          type="number"
          min={2}
          value={capacidade}
          onChange={(evento) => setCapacidade(evento.target.value)}
          placeholder="16"
          className="mt-1 block w-24 rounded border border-gray-300 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-gray-700">Inscrições abrem em (opcional)</span>
        <input
          type="datetime-local"
          value={inscricoesAbremEm}
          onChange={(evento) => setInscricoesAbremEm(evento.target.value)}
          className="mt-1 block rounded border border-gray-300 px-2 py-1.5 text-sm"
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-gray-700">Inscrições encerram em (opcional)</span>
        <input
          type="datetime-local"
          value={inscricoesEncerramEm}
          onChange={(evento) => setInscricoesEncerramEm(evento.target.value)}
          className="mt-1 block rounded border border-gray-300 px-2 py-1.5 text-sm"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando || horarios.length === 0}
          className="admin-button admin-button-primary"
        >
          {enviando ? 'Criando...' : 'Criar partida'}
        </button>
        <button
          type="button"
          onClick={aoCancelar}
          disabled={enviando}
          className="admin-button admin-button-secondary"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
