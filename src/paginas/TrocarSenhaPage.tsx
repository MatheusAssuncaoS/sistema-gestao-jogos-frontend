import { useRef, useState, type FormEvent, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexto/useAuth';
import { ApiError, ErroDeRede } from '../servicos/api';
import { authService } from '../servicos/authService';
import { validarSenha } from '../validacao/cadastro';

const ORDEM_CAMPOS = ['senhaAtual', 'novaSenha', 'confirmacao'] as const;

interface DadosFormulario {
  senhaAtual: string;
  novaSenha: string;
  confirmacao: string;
}

function validar(dados: DadosFormulario): Record<string, string> {
  const erros: Record<string, string> = {};

  if (!dados.senhaAtual) {
    erros.senhaAtual = 'Informe a senha atual.';
  }

  const erroNovaSenha = validarSenha(dados.novaSenha);
  if (erroNovaSenha) {
    erros.novaSenha = erroNovaSenha;
  } else if (dados.novaSenha && dados.novaSenha === dados.senhaAtual) {
    erros.novaSenha = 'A nova senha deve ser diferente da senha atual.';
  }

  if (dados.confirmacao !== dados.novaSenha) {
    erros.confirmacao = 'A confirmação não confere com a nova senha.';
  }

  return erros;
}

/**
 * Tela de troca obrigatória de senha.
 *
 * Chega aqui quem tem uma senha provisória (definida pelo administrador na
 * redefinição de senha). Fica fora do Layout de propósito: mostrar links de
 * navegação para rotas que o usuário ainda não pode acessar só confundiria.
 */
export function TrocarSenhaPage() {
  const { recarregarUsuario, sair } = useAuth();
  const navigate = useNavigate();

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');

  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [errosPorCampo, setErrosPorCampo] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const refsPorCampo: Record<(typeof ORDEM_CAMPOS)[number], RefObject<HTMLInputElement | null>> = {
    senhaAtual: useRef<HTMLInputElement>(null),
    novaSenha: useRef<HTMLInputElement>(null),
    confirmacao: useRef<HTMLInputElement>(null),
  };

  async function submeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroGeral(null);

    const erros = validar({ senhaAtual, novaSenha, confirmacao });
    if (Object.keys(erros).length > 0) {
      setErrosPorCampo(erros);
      const primeiroCampoInvalido = ORDEM_CAMPOS.find((campo) => erros[campo]);
      if (primeiroCampoInvalido) {
        refsPorCampo[primeiroCampoInvalido].current?.focus();
      }
      return;
    }
    setErrosPorCampo({});

    setEnviando(true);

    try {
      await authService.trocarSenha({ senhaAtual, novaSenha });

      // O guard de rota decide se ainda há troca pendente com base no
      // usuário do AuthContext, que não muda sozinho — o endpoint responde
      // 204, então é preciso buscar o usuário atualizado.
      await recarregarUsuario();

      navigate('/', { replace: true });
    } catch (falha) {
      if (falha instanceof ApiError) {
        if (falha.campos) {
          setErrosPorCampo(falha.campos);
          const primeiroCampoInvalido = ORDEM_CAMPOS.find((campo) => falha.campos?.[campo]);
          if (primeiroCampoInvalido) {
            refsPorCampo[primeiroCampoInvalido].current?.focus();
          }
        } else {
          setErroGeral(falha.detail);
        }
      } else if (falha instanceof ErroDeRede) {
        setErroGeral('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
      } else {
        setErroGeral('Não foi possível trocar a senha. Tente novamente.');
      }
    } finally {
      setEnviando(false);
    }
  }

  async function aoSair() {
    await sair();
    navigate('/login', { replace: true });
  }

  return (
    <div className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-bold">Trocar senha</h1>

      <p className="mt-2 text-sm text-gray-600">
        Sua senha atual é provisória. Defina uma nova senha para continuar.
      </p>

      <form onSubmit={submeter} className="mt-6 space-y-4" noValidate>
        <CampoDeSenha
          id="campo-senha-atual"
          rotulo="Senha atual"
          valor={senhaAtual}
          aoAlterar={setSenhaAtual}
          autoComplete="current-password"
          erro={errosPorCampo.senhaAtual}
          campoRef={refsPorCampo.senhaAtual}
        />

        <CampoDeSenha
          id="campo-nova-senha"
          rotulo="Nova senha"
          valor={novaSenha}
          aoAlterar={setNovaSenha}
          autoComplete="new-password"
          erro={errosPorCampo.novaSenha}
          campoRef={refsPorCampo.novaSenha}
          ajuda="Entre 8 e 72 caracteres."
        />

        <CampoDeSenha
          id="campo-confirmacao"
          rotulo="Confirme a nova senha"
          valor={confirmacao}
          aoAlterar={setConfirmacao}
          autoComplete="new-password"
          erro={errosPorCampo.confirmacao}
          campoRef={refsPorCampo.confirmacao}
        />

        {erroGeral && <p className="text-sm text-red-600">{erroGeral}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {enviando ? 'Trocando senha...' : 'Trocar senha'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        <button type="button" onClick={aoSair} className="text-blue-600 hover:underline">
          Sair
        </button>
      </p>
    </div>
  );
}

interface CampoDeSenhaProps {
  id: string;
  rotulo: string;
  valor: string;
  aoAlterar: (novoValor: string) => void;
  autoComplete?: string;
  erro?: string;
  ajuda?: string;
  campoRef?: RefObject<HTMLInputElement | null>;
}

function CampoDeSenha({
  id,
  rotulo,
  valor,
  aoAlterar,
  autoComplete,
  erro,
  ajuda,
  campoRef,
}: CampoDeSenhaProps) {
  const idErro = `${id}-erro`;
  const idAjuda = `${id}-ajuda`;

  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{rotulo}</span>

      <input
        id={id}
        ref={campoRef}
        type="password"
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
        autoComplete={autoComplete}
        required
        aria-invalid={erro ? 'true' : undefined}
        aria-describedby={erro ? idErro : ajuda ? idAjuda : undefined}
        className={`mt-1 block w-full rounded border px-3 py-2 ${
          erro ? 'border-red-500' : 'border-gray-300'
        }`}
      />

      {erro ? (
        <span id={idErro} className="mt-1 block text-xs text-red-600">
          {erro}
        </span>
      ) : ajuda ? (
        <span id={idAjuda} className="mt-1 block text-xs text-gray-500">
          {ajuda}
        </span>
      ) : null}
    </label>
  );
}
