import { useCallback, useEffect, useState, type FormEvent } from 'react';

import { adminJogadorService } from '../servicos/adminJogadorService';
import { ApiError } from '../servicos/api';
import type { CadastroPendente, Categoria, SituacaoAssociativa } from '../servicos/tipos';

const formatador = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function formatarData(valor: string) {
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? '' : formatador.format(data);
}

function mensagemDeErro(falha: unknown): string {
  if (falha instanceof ApiError) {
    if (falha.status === 401 || falha.status === 403) {
      return 'Sessão de administrador expirada. Entre novamente.';
    }
    return falha.detail;
  }
  return 'Não foi possível completar a operação. Tente novamente.';
}

/**
 * UC27: aprovação e recusa de cadastros pendentes.
 *
 * Aprovar exige categoria e situação associativa (o backend recusa sem
 * isso), então o botão "Aprovar" abre um formulário inline em vez de
 * disparar a requisição direto. Recusar não precisa de dados extras.
 */
export function CadastrosPendentes() {
  const [cadastros, setCadastros] = useState<CadastroPendente[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [emAndamento, setEmAndamento] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');
  const [formularioAberto, setFormularioAberto] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const [pendentes, categoriasAtivas] = await Promise.all([
        adminJogadorService.listarPendentes(),
        adminJogadorService.listarCategorias(),
      ]);
      setCadastros(pendentes);
      setCategorias(categoriasAtivas);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function aprovar(
    cadastro: CadastroPendente,
    dados: { matriculaAssociado: string; categoriaId: number; situacaoAssociativa: SituacaoAssociativa }
  ) {
    setEmAndamento(cadastro.usuarioId);
    setErro(null);
    try {
      await adminJogadorService.aprovar(cadastro.usuarioId, {
        matriculaAssociado: dados.matriculaAssociado || undefined,
        categoriaId: dados.categoriaId,
        situacaoAssociativa: dados.situacaoAssociativa,
      });
      setCadastros((atual) => atual.filter((c) => c.usuarioId !== cadastro.usuarioId));
      setFormularioAberto(null);
      setAviso(`Cadastro de ${cadastro.nome} aprovado.`);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEmAndamento(null);
    }
  }

  async function recusar(cadastro: CadastroPendente) {
    if (!window.confirm(`Recusar o cadastro de ${cadastro.nome}?`)) {
      return;
    }

    setEmAndamento(cadastro.usuarioId);
    setErro(null);
    try {
      await adminJogadorService.recusar(cadastro.usuarioId);
      setCadastros((atual) => atual.filter((c) => c.usuarioId !== cadastro.usuarioId));
      setAviso(`Cadastro de ${cadastro.nome} recusado.`);
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEmAndamento(null);
    }
  }

  return (
    <section aria-labelledby="titulo-pendentes" className="mt-6 max-w-3xl">
      <header className="flex items-baseline justify-between gap-4">
        <h2 id="titulo-pendentes" className="text-lg font-semibold">
          Cadastros aguardando aprovação
        </h2>
        <button
          type="button"
          onClick={carregar}
          disabled={carregando}
          className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          Atualizar lista
        </button>
      </header>

      <p role="status" aria-live="polite" className="mt-1 min-h-5 text-sm text-green-700">
        {aviso}
      </p>

      {erro && (
        <p className="my-2 text-sm text-red-600">
          {erro}{' '}
          <button type="button" onClick={carregar} className="text-blue-600 hover:underline">
            Tentar de novo
          </button>
        </p>
      )}

      {carregando && <p className="text-gray-600">Carregando cadastros...</p>}

      {!carregando && !erro && cadastros.length === 0 && (
        <p className="text-gray-600">Nenhum cadastro aguardando aprovação no momento.</p>
      )}

      {cadastros.length > 0 && (
        <ul className="mt-4 space-y-2">
          {cadastros.map((cadastro) => (
            <li key={cadastro.usuarioId} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <strong className="text-base">{cadastro.nome}</strong>
                  <div className="text-sm text-gray-600">{cadastro.email}</div>
                  {cadastro.cadastradoEm && (
                    <div className="text-sm text-gray-600">
                      Cadastrado em {formatarData(cadastro.cadastradoEm)}
                    </div>
                  )}
                </div>

                {formularioAberto !== cadastro.usuarioId && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormularioAberto(cadastro.usuarioId)}
                      disabled={emAndamento !== null}
                      className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Aprovar
                    </button>
                    <button
                      type="button"
                      onClick={() => recusar(cadastro)}
                      disabled={emAndamento !== null}
                      className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                      {emAndamento === cadastro.usuarioId ? 'Recusando...' : 'Recusar'}
                    </button>
                  </div>
                )}
              </div>

              {formularioAberto === cadastro.usuarioId && (
                <FormularioDeAprovacao
                  categorias={categorias}
                  enviando={emAndamento === cadastro.usuarioId}
                  aoConfirmar={(dados) => aprovar(cadastro, dados)}
                  aoCancelar={() => setFormularioAberto(null)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface FormularioDeAprovacaoProps {
  categorias: Categoria[];
  enviando: boolean;
  aoConfirmar: (dados: {
    matriculaAssociado: string;
    categoriaId: number;
    situacaoAssociativa: SituacaoAssociativa;
  }) => void;
  aoCancelar: () => void;
}

function FormularioDeAprovacao({
  categorias,
  enviando,
  aoConfirmar,
  aoCancelar,
}: FormularioDeAprovacaoProps) {
  const [matricula, setMatricula] = useState('');
  const [categoriaId, setCategoriaId] = useState<number | ''>(categorias[0]?.id ?? '');
  const [situacao, setSituacao] = useState<SituacaoAssociativa>('REGULAR');

  function submeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (categoriaId === '') return;

    aoConfirmar({
      matriculaAssociado: matricula,
      categoriaId: Number(categoriaId),
      situacaoAssociativa: situacao,
    });
  }

  return (
    <form onSubmit={submeter} className="mt-4 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4">
      <label className="block">
        <span className="text-xs font-medium text-gray-700">Categoria</span>
        <select
          value={categoriaId}
          onChange={(evento) =>
            setCategoriaId(evento.target.value === '' ? '' : Number(evento.target.value))
          }
          required
          className="mt-1 block rounded border border-gray-300 px-2 py-1.5 text-sm"
        >
          <option value="" disabled>
            Selecione
          </option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-medium text-gray-700">Situação associativa</span>
        <select
          value={situacao}
          onChange={(evento) => setSituacao(evento.target.value as SituacaoAssociativa)}
          className="mt-1 block rounded border border-gray-300 px-2 py-1.5 text-sm"
        >
          <option value="REGULAR">Regular</option>
          <option value="IRREGULAR">Irregular</option>
          <option value="PENDENTE">Pendente</option>
        </select>
      </label>

      <label className="block">
        <span className="text-xs font-medium text-gray-700">Matrícula (opcional)</span>
        <input
          type="text"
          value={matricula}
          onChange={(evento) => setMatricula(evento.target.value)}
          className="mt-1 block rounded border border-gray-300 px-2 py-1.5 text-sm"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando || categorias.length === 0}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {enviando ? 'Aprovando...' : 'Confirmar aprovação'}
        </button>
        <button
          type="button"
          onClick={aoCancelar}
          disabled={enviando}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
