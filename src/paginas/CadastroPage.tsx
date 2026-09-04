import { useRef, useState, type FormEvent, type RefObject } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '../componentes/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../componentes/ui/card';
import { Input } from '../componentes/ui/input';
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
    <main className="login-page signup-page">
      <section className="login-shell signup-shell" aria-labelledby="signup-title">
        <img
          className="login-logo signup-logo"
          src="/branding/clubeone-logo.png"
          alt="ClubeOne"
        />

        <Card className="login-card signup-card">
          <CardHeader className="login-card-header signup-card-header">
            <CardTitle id="signup-title">Crie sua conta</CardTitle>
            <CardDescription>Preencha seus dados para participar do clube</CardDescription>
          </CardHeader>

          <CardContent className="login-card-content signup-card-content">
            <form onSubmit={submeter} className="login-form signup-form" noValidate>
              <CampoDeTexto
                id="campo-nome"
                rotulo="Nome completo"
                placeholder="Seu nome completo"
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
                placeholder="seuemail@exemplo.com"
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
                ajuda="Use de 8 a 72 caracteres, incluindo maiúscula, minúscula, número e símbolo."
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

              {erroGeral && <p className="login-error signup-general-error" role="alert">{erroGeral}</p>}

              <Button type="submit" disabled={enviando} className="login-submit signup-submit">
                {enviando ? 'Criando conta...' : 'Criar conta'}
              </Button>
            </form>

            <p className="login-signup signup-login-link">
              Já tem uma conta? <Link to="/login">Entrar</Link>
            </p>
          </CardContent>
        </Card>

        <p className="login-terms">
          Ao criar uma conta, você concorda com nossos <a href="#termos">Termos de Uso</a> e{' '}
          <a href="#privacidade">Política de Privacidade</a>.
        </p>
      </section>
    </main>
  );
}

interface CampoProps {
  id: string;
  rotulo: string;
  placeholder?: string;
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
  placeholder,
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
    <label className="login-field signup-field">
      <span>{rotulo}</span>

      <Input
        id={id}
        ref={campoRef}
        type={tipo}
        placeholder={placeholder}
        value={valor}
        onChange={(evento) => aoAlterar(evento.target.value)}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={erro ? 'true' : undefined}
        aria-describedby={erro ? idErro : ajuda ? idAjuda : undefined}
        className={erro ? 'signup-input-error' : undefined}
      />

      {erro ? (
        <span id={idErro} className="signup-field-message signup-field-error">
          {erro}
        </span>
      ) : ajuda ? (
        <span id={idAjuda} className="signup-field-message">
          {ajuda}
        </span>
      ) : null}
    </label>
  );
}
