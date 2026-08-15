import { useState, type FormEvent } from 'react';

import { useAuth } from '../contexto/useAuth';
import { ApiError, ErroDeRede } from '../servicos/api';
import { authService } from '../servicos/authService';
import { usuarioService } from '../servicos/usuarioService';
import { validarEmail, validarSenha } from '../validacao/cadastro';

type AbaPerfil = 'perfil' | 'seguranca';

export function MeusDadosPage() {
  const { usuario, atualizarUsuario, recarregarUsuario } = useAuth();
  const [aba, setAba] = useState<AbaPerfil>('perfil');
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [email, setEmail] = useState(usuario?.email ?? '');
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [errosSenha, setErrosSenha] = useState<Record<string, string>>({});
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [senhaAlterada, setSenhaAlterada] = useState(false);
  const [trocandoSenha, setTrocandoSenha] = useState(false);

  async function submeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const novosErros: Record<string, string> = {};
    if (!nome.trim()) novosErros.nome = 'Informe seu nome.';
    if (nome.trim().length > 150) novosErros.nome = 'O nome deve ter no máximo 150 caracteres.';
    const erroEmail = validarEmail(email.trim());
    if (erroEmail) novosErros.email = erroEmail;
    if (email.trim().length > 200) novosErros.email = 'O e-mail deve ter no máximo 200 caracteres.';
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setSalvando(true);
    setSalvo(false);
    setErroGeral(null);
    try {
      const atualizado = await usuarioService.atualizarMeusDados({
        nome: nome.trim(),
        email: email.trim(),
      });
      atualizarUsuario(atualizado);
      setNome(atualizado.nome);
      setEmail(atualizado.email);
      setSalvo(true);
    } catch (falha) {
      if (falha instanceof ApiError && falha.campos) {
        setErros(falha.campos);
      } else {
        setErroGeral(falha instanceof ApiError ? falha.detail : 'Não foi possível atualizar seus dados.');
      }
    } finally {
      setSalvando(false);
    }
  }

  async function trocarSenha(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const novosErros: Record<string, string> = {};
    if (!senhaAtual) novosErros.senhaAtual = 'Informe a senha atual.';
    const erroNovaSenha = validarSenha(novaSenha);
    if (erroNovaSenha) novosErros.novaSenha = erroNovaSenha;
    else if (novaSenha === senhaAtual) novosErros.novaSenha = 'A nova senha deve ser diferente da senha atual.';
    if (confirmacao !== novaSenha) novosErros.confirmacao = 'A confirmação não confere com a nova senha.';
    setErrosSenha(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    setTrocandoSenha(true);
    setErroSenha(null);
    setSenhaAlterada(false);
    try {
      await authService.trocarSenha({ senhaAtual, novaSenha });
      await recarregarUsuario();
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmacao('');
      setSenhaAlterada(true);
    } catch (falha) {
      if (falha instanceof ApiError && falha.campos) setErrosSenha(falha.campos);
      else if (falha instanceof ApiError) setErroSenha(falha.detail);
      else if (falha instanceof ErroDeRede) setErroSenha('Não foi possível conectar ao servidor. Tente novamente.');
      else setErroSenha('Não foi possível trocar a senha. Tente novamente.');
    } finally {
      setTrocandoSenha(false);
    }
  }

  return (
    <section className="profile-page" aria-labelledby="titulo-dados">
      <header className="profile-page-heading">
        <div>
          <span>Configurações da conta</span>
          <h1 id="titulo-dados">Meu perfil</h1>
          <p>Atualize suas informações pessoais e consulte seus acessos.</p>
        </div>
      </header>

      <div className="profile-card">
        <nav className="profile-tabs" aria-label="Configurações do perfil">
          <button type="button" onClick={() => setAba('perfil')} className={aba === 'perfil' ? 'profile-tab-active' : ''} aria-current={aba === 'perfil' ? 'page' : undefined}>Editar perfil</button>
          <button type="button" onClick={() => setAba('seguranca')} className={aba === 'seguranca' ? 'profile-tab-active' : ''} aria-current={aba === 'seguranca' ? 'page' : undefined}>Segurança</button>
        </nav>

        {aba === 'perfil' ? <form onSubmit={submeter} noValidate className="profile-form">
          <aside className="profile-avatar-area">
            <div className="profile-avatar" aria-hidden="true">
              {usuario?.nome?.charAt(0).toUpperCase() ?? 'U'}
              <span>✎</span>
            </div>
            <strong>{usuario?.nome}</strong>
            <small>{usuario?.email}</small>
          </aside>

          <div className="profile-fields">
            <label>
              <span>Nome completo</span>
              <input
                value={nome}
                onChange={(evento) => { setNome(evento.target.value); setSalvo(false); }}
                autoComplete="name"
                aria-invalid={erros.nome ? 'true' : undefined}
                className={erros.nome ? 'profile-input-error' : undefined}
              />
              {erros.nome && <small className="profile-error">{erros.nome}</small>}
            </label>

            <label>
              <span>E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(evento) => { setEmail(evento.target.value); setSalvo(false); }}
                autoComplete="email"
                aria-invalid={erros.email ? 'true' : undefined}
                className={erros.email ? 'profile-input-error' : undefined}
              />
              {erros.email && <small className="profile-error">{erros.email}</small>}
            </label>

            <label>
              <span>Status da conta</span>
              <input value={usuario?.status ?? ''} readOnly aria-readonly="true" />
            </label>

            <label>
              <span>Perfis de acesso</span>
              <input value={usuario?.papeis.join(', ') || 'Aguardando aprovação'} readOnly aria-readonly="true" />
            </label>

            <div className="profile-feedback">
              {erroGeral && <p role="alert">{erroGeral}</p>}
              {salvo && <p role="status">Dados atualizados com sucesso.</p>}
            </div>

            <div className="profile-actions">
              <button
                type="submit"
                disabled={salvando || (nome.trim() === usuario?.nome && email.trim() === usuario?.email)}
              >
                {salvando ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>
        </form> : <form onSubmit={trocarSenha} noValidate className="profile-form">
          <aside className="profile-avatar-area">
            <div className="profile-avatar profile-security-avatar" aria-hidden="true">⌁</div>
            <strong>Segurança da conta</strong>
            <small>Use uma senha exclusiva e segura</small>
          </aside>

          <div className="profile-fields profile-security-fields">
            <div className="profile-security-intro">
              <h2>Alterar senha</h2>
              <p>Informe sua senha atual e escolha uma nova senha entre 8 e 72 caracteres.</p>
            </div>
            <label>
              <span>Senha atual</span>
              <input type="password" value={senhaAtual} onChange={(evento) => { setSenhaAtual(evento.target.value); setSenhaAlterada(false); }} autoComplete="current-password" className={errosSenha.senhaAtual ? 'profile-input-error' : undefined} />
              {errosSenha.senhaAtual && <small className="profile-error">{errosSenha.senhaAtual}</small>}
            </label>
            <div />
            <label>
              <span>Nova senha</span>
              <input type="password" value={novaSenha} onChange={(evento) => { setNovaSenha(evento.target.value); setSenhaAlterada(false); }} autoComplete="new-password" className={errosSenha.novaSenha ? 'profile-input-error' : undefined} />
              {errosSenha.novaSenha && <small className="profile-error">{errosSenha.novaSenha}</small>}
            </label>
            <label>
              <span>Confirme a nova senha</span>
              <input type="password" value={confirmacao} onChange={(evento) => { setConfirmacao(evento.target.value); setSenhaAlterada(false); }} autoComplete="new-password" className={errosSenha.confirmacao ? 'profile-input-error' : undefined} />
              {errosSenha.confirmacao && <small className="profile-error">{errosSenha.confirmacao}</small>}
            </label>
            <div className="profile-feedback">
              {erroSenha && <p role="alert">{erroSenha}</p>}
              {senhaAlterada && <p role="status">Senha alterada com sucesso.</p>}
            </div>
            <div className="profile-actions">
              <button type="submit" disabled={trocandoSenha}>{trocandoSenha ? 'Alterando...' : 'Alterar senha'}</button>
            </div>
          </div>
        </form>}
      </div>
    </section>
  );
}
