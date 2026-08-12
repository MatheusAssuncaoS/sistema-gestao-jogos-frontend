import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexto/useAuth';
import { ApiError } from '../servicos/api';
import { authService } from '../servicos/authService';

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

  async function submeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErroGeral(null);
    setErrosPorCampo({});

    if (senha !== confirmacao) {
      setErrosPorCampo({ confirmacao: 'A confirmação não confere com a senha.' });
      return;
    }

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
          rotulo="Nome completo"
          valor={nome}
          aoAlterar={setNome}
          autoComplete="name"
          erro={errosPorCampo.nome}
          required
        />

        <CampoDeTexto
          rotulo="E-mail"
          tipo="email"
          valor={email}
          aoAlterar={setEmail}
          autoComplete="email"
          erro={errosPorCampo.email}
          required
        />

        <CampoDeTexto
          rotulo="Senha"
          tipo="password"
          valor={senha}
          aoAlterar={setSenha}
          autoComplete="new-password"
          erro={errosPorCampo.senha}
          ajuda="Entre 8 e 72 caracteres."
          required
        />

        <CampoDeTexto
          rotulo="Confirme a senha"
          tipo="password"
          valor={confirmacao}
          aoAlterar={setConfirmacao}
          autoComplete="new-password"
          erro={errosPorCampo.confirmacao}
          required
        />

        {erroGeral && <p className="text-sm text-red-600">{erroGeral}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {enviando ? 'Criando...' : 'Criar conta'}
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
  rotulo: string;
  valor: string;
  aoAlterar: (novoValor: string) => void;
  tipo?: 'text' | 'email' | 'password';
  autoComplete?: string;
  erro?: string;
  ajuda?: string;
  required?: boolean;
}

/**
 * Campo de texto com rótulo, mensagem de ajuda e erro do backend.
 *
 * Extraído porque todos os campos do formulário seguem a mesma estrutura;
 * repetir a marcação quatro vezes viraria fonte de inconsistência.
 */
function CampoDeTexto({
  rotulo,
  valor,
  aoAlterar,
  tipo = 'text',
  autoComplete,
  erro,
  ajuda,
  required,
}: CampoProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{rotulo}</span>

      <input
        type={tipo}
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={erro ? 'true' : undefined}
        className={`mt-1 block w-full rounded border px-3 py-2 ${
          erro ? 'border-red-500' : 'border-gray-300'
        }`}
      />

      {erro ? (
        <span className="mt-1 block text-xs text-red-600">{erro}</span>
      ) : ajuda ? (
        <span className="mt-1 block text-xs text-gray-500">{ajuda}</span>
      ) : null}
    </label>
  );
}
