import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../contexto/useAuth';
import { ApiError } from '../servicos/api';

interface EstadoNavegacao {
  de?: string;
}

/**
 * Tela de login.
 *
 * Se o usuário chegou aqui via redirect de uma rota protegida, o estado da
 * navegação carrega o caminho original em `de`. Depois do login, volta para
 * lá em vez de ir para a home padrão do papel.
 */
export function LoginPage() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const localizacao = useLocation();

  const destinoOriginal = (localizacao.state as EstadoNavegacao | null)?.de;

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function submeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setEnviando(true);

    try {
      const usuario = await entrar({ email, senha });

      if (destinoOriginal) {
        navigate(destinoOriginal, { replace: true });
      } else if (usuario.papeis.includes('ADMINISTRADOR')) {
        navigate('/admin', { replace: true });
      } else if (usuario.papeis.includes('ORGANIZADOR')) {
        navigate('/organizador', { replace: true });
      } else {
        navigate('/partidas', { replace: true });
      }
    } catch (falha) {
      setErro(
        falha instanceof ApiError
          ? falha.detail
          : 'Não foi possível entrar. Tente novamente.'
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-bold">Entrar</h1>

      <form onSubmit={submeter} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            required
            autoComplete="email"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Senha</span>
          <input
            type="password"
            value={senha}
            onChange={(evento) => setSenha(evento.target.value)}
            required
            autoComplete="current-password"
            className="mt-1 block w-full rounded border border-gray-300 px-3 py-2"
          />
        </label>

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Não tem conta?{' '}
        <Link to="/cadastro" className="text-blue-600 hover:underline">
          Criar conta
        </Link>
      </p>

      <p className="mt-2 text-sm text-gray-600">
        <Link to="/recuperar-senha" className="text-blue-600 hover:underline">
          Esqueci minha senha
        </Link>
      </p>
    </div>
  );
}
