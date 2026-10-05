import { destinoInicial } from '../seguranca/permissoes';
import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '../componentes/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../componentes/ui/card';
import { Input } from '../componentes/ui/input';
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
      } else {
        navigate(destinoInicial(usuario), { replace: true });
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
    <main className="login-page">
      <section className="login-shell" aria-labelledby="login-title">
        <img
          className="login-logo"
          src="/branding/clubeone-logo.png"
          alt="ClubeOne"
        />

        <Card className="login-card">
          <CardHeader className="login-card-header">
            <CardTitle id="login-title">Bem-vindo ao ClubeOne</CardTitle>
            <CardDescription>Acesse sua conta</CardDescription>
          </CardHeader>

          <CardContent className="login-card-content">
            <form onSubmit={submeter} className="login-form">
              <label className="login-field">
                <span>E-mail</span>
                <Input
                  type="email"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  placeholder="seuemail@exemplo.com"
                  required
                  autoComplete="email"
                  aria-invalid={erro ? 'true' : undefined}
                />
              </label>

              <label className="login-field">
                <span className="login-password-label">
                  <span>Senha</span>
                  <Link to="/recuperar-senha">Esqueceu a senha?</Link>
                </span>
                <Input
                  type="password"
                  value={senha}
                  onChange={(evento) => setSenha(evento.target.value)}
                  required
                  autoComplete="current-password"
                  aria-invalid={erro ? 'true' : undefined}
                />
              </label>

              {erro && <p className="login-error" role="alert">{erro}</p>}

              <Button type="submit" disabled={enviando} className="login-submit">
                {enviando ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <p className="login-signup">
              Não tem uma conta? <Link to="/cadastro">Crie uma agora</Link>
            </p>
          </CardContent>
        </Card>

        <p className="login-terms">
          Ao continuar, você concorda com nossos <a href="#termos">Termos de Uso</a> e{' '}
          <a href="#privacidade">Política de Privacidade</a>.
        </p>
      </section>
    </main>
  );
}
