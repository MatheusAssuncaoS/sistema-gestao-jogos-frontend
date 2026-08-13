import { useRef, useState, type FormEvent, type RefObject } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexto/useAuth';
import { ApiError, ErroDeRede } from '../servicos/api';
import { authService } from '../servicos/authService';
import { validarCadastro } from '../validacao/cadastro';

const ORDEM_CAMPOS = ['nome', 'email', 'senha', 'confirmacao'] as const;

/**
 * Tela de cadastro.
 *
 * O fluxo intencional é: o backend cria o usuário como PENDENTE, sem papéis.
 * Depois do cadastro, o usuário é logado automaticamente e redirecionado
 * para uma tela que explica que a conta aguarda aprovação. Isso evita a
 * confusão de logar sozinho depois e não ter permissão para nada.
 */
export function CadastroPage() {
  const { entrar } = useAuth();
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');

  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [errosPorCampo, setErrosPorCampo] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const refsPorCampo: Record<(typeof ORDEM_CAMPOS)[number], RefObject<HTMLInputElement | null>> = {
    nome: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    senha: useRef<HTMLInputElement>(null),
    confirmacao: useRef<HTMLInputElement>(null),
  };

  async function submeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroGeral(null);

    const erros = validarCadastro({ nome, email, senha, confirmacao });
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
      await authService.cadastrar({ nome, email, senha });

      // Login automático após o cadastro: como o backend responde 201 sem
      // criar sessão, precisamos entrar em seguida para levar o usuário
      // direto ao próximo passo.
      await entrar({ email, senha });

      navigate('/', { replace: true });
    } catch (falha) {
      if (falha instanceof ApiError) {
        if (falha.campos) {
          setErrosPorCampo(falha.campos);
        } else {
          setErroGeral(falha.detail);
        }
      } else if (falha instanceof ErroDeRede) {
        setErroGeral('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
      } else {
        setErroGeral('Não foi possível criar a conta. Tente novamente.');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-bold">Criar conta</h1>

      <p className="mt-2 text-sm text-gray-600">
        Após o cadastro, um administrador precisa aprovar sua conta para você
        poder se inscrever em partidas.
      </p>

      <form onSubmit={submeter} className="mt-6 space-y-4" noValidate>
        <CampoDeTexto
          id="campo-nome"
          rotulo="Nome completo"
          valor={nome}
          aoAlterar={setNome}
          autoComplete="name"
          erro={errosPorCampo.nome}
          campoRef={refsPorCampo.nome}
          required
        />

        <CampoDeTexto
          id="campo-email"
          rotulo="E-mail"
          tipo="email"
          valor={email}
          aoAlterar={setEmail}
          autoComplete="email"
          erro={errosPorCampo.email}
          campoRef={refsPorCampo.email}
          required
        />

        <CampoDeTexto
          id="campo-senha"
          rotulo="Senha"
          tipo="password"
          valor={senha}
          aoAlterar={setSenha}
          autoComplete="new-password"
          erro={errosPorCampo.senha}
          campoRef={refsPorCampo.senha}
          ajuda="Entre 8 e 72 caracteres."
          required
        />

        <CampoDeTexto
          id="campo-confirmacao"
          rotulo="Confirme a senha"
          tipo="password"
          valor={confirmacao}
          aoAlterar={setConfirmacao}
          autoComplete="new-password"
          erro={errosPorCampo.confirmacao}
          campoRef={refsPorCampo.confirmacao}
          required
        />

        {erroGeral && <p className="text-sm text-red-600">{erroGeral}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {enviando ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Já tem conta?{' '}
        <Link to="/login" className="text-blue-600 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}

interface CampoProps {
  id: string;
  rotulo: string;
  valor: string;
  aoAlterar: (novoValor: string) => void;
  tipo?: 'text' | 'email' | 'password';
  autoComplete?: string;
  erro?: string;
  ajuda?: string;
  required?: boolean;
  campoRef?: RefObject<HTMLInputElement | null>;
}

/**
 * Campo de texto com rótulo, mensagem de ajuda e erro do backend.
 *
 * Extraído porque todos os campos do formulário seguem a mesma estrutura;
 * repetir a marcação quatro vezes viraria fonte de inconsistência.
 */
function CampoDeTexto({
  id,
  rotulo,
  valor,
  aoAlterar,
  tipo = 'text',
  autoComplete,
  erro,
  ajuda,
  required,
  campoRef,
}: CampoProps) {
  const idErro = `${id}-erro`;
  const idAjuda = `${id}-ajuda`;

  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{rotulo}</span>

      <input
        id={id}
        ref={campoRef}
        type={tipo}
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
        autoComplete={autoComplete}
        required={required}
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
