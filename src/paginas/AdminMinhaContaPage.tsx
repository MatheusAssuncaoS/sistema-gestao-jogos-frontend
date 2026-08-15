import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';

import { useAuth } from '../contexto/useAuth';
import { ApiError, ErroDeRede } from '../servicos/api';
import { authService } from '../servicos/authService';
import { usuarioService } from '../servicos/usuarioService';

const ORIENTACAO_SENHA = 'A nova senha ainda não atende a todos os requisitos.';

export function AdminMinhaContaPage() {
  const { usuario, atualizarUsuario, recarregarUsuario } = useAuth();
  const [aba, setAba] = useState<'dados' | 'seguranca'>('dados');
  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [erroNome, setErroNome] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [mostrarSenhas, setMostrarSenhas] = useState(false);
  const [errosSenha, setErrosSenha] = useState<Record<string, string>>({});
  const [trocando, setTrocando] = useState(false);

  async function salvarDados(evento: FormEvent) {
    evento.preventDefault();
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) { setErroNome('Informe seu nome.'); return; }
    if (nomeLimpo.length > 150) { setErroNome('O nome deve ter no máximo 150 caracteres.'); return; }
    if (!usuario) return;
    setSalvando(true);
    setErroGeral(null);
    setAviso(null);
    try {
      const atualizado = await usuarioService.atualizarMeusDados({ nome: nomeLimpo, email: usuario.email });
      atualizarUsuario(atualizado);
      setNome(atualizado.nome);
      setAviso('Dados pessoais atualizados com sucesso.');
    } catch (falha) {
      setErroGeral(falha instanceof ApiError ? falha.detail : 'Não foi possível atualizar seus dados.');
    } finally {
      setSalvando(false);
    }
  }

  async function alterarSenha(evento: FormEvent) {
    evento.preventDefault();
    const erros: Record<string, string> = {};
    if (!senhaAtual) erros.senhaAtual = 'Informe a senha atual.';
    const erroNova = validarNovaSenha(novaSenha);
    if (erroNova) erros.novaSenha = erroNova;
    else if (novaSenha === senhaAtual) erros.novaSenha = 'A nova senha deve ser diferente da atual.';
    if (confirmacao !== novaSenha) erros.confirmacao = 'A confirmação não confere com a nova senha.';
    setErrosSenha(erros);
    if (Object.keys(erros).length > 0) return;
    setTrocando(true);
    setErroGeral(null);
    setAviso(null);
    try {
      await authService.trocarSenha({ senhaAtual, novaSenha });
      await recarregarUsuario();
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmacao('');
      setAviso('Senha alterada com sucesso.');
    } catch (falha) {
      if (falha instanceof ApiError && falha.campos) setErrosSenha(falha.campos);
      else if (falha instanceof ApiError) setErroGeral(falha.detail);
      else if (falha instanceof ErroDeRede) setErroGeral('Não foi possível conectar ao servidor. Tente novamente.');
      else setErroGeral('Não foi possível alterar a senha. Tente novamente.');
    } finally {
      setTrocando(false);
    }
  }

  const alterado = nome.trim() !== usuario?.nome;
  const erroConfirmacao = errosSenha.confirmacao || (confirmacao.length > 0 && confirmacao !== novaSenha ? 'As senhas não coincidem.' : undefined);

  return (
    <section className="admin-account-page" aria-labelledby="admin-account-title">
      <header className="admin-card-header admin-account-heading"><div><h1 id="admin-account-title">Minha conta</h1><p>Gerencie seus dados pessoais e configurações de segurança.</p></div></header>
      <nav className="admin-account-tabs" aria-label="Configurações da conta"><button type="button" className={aba === 'dados' ? 'active' : ''} onClick={() => { setAba('dados'); setErroGeral(null); setAviso(null); }}><UserRound aria-hidden="true" />Dados pessoais</button><button type="button" className={aba === 'seguranca' ? 'active' : ''} onClick={() => { setAba('seguranca'); setErroGeral(null); setAviso(null); }}><LockKeyhole aria-hidden="true" />Segurança</button></nav>
      <div className="admin-account-content">
        {aviso && <p className="admin-account-success" role="status">{aviso}</p>}
        {erroGeral && <p className="admin-account-error" role="alert">{erroGeral}</p>}
        {aba === 'dados' && <><header className="admin-account-identity"><span>{iniciais(usuario?.nome)}</span><div><h2>{usuario?.nome}</h2><p>{rotulosPerfis(usuario?.papeis)}</p></div></header><article className="admin-account-section"><header><h2>Informações pessoais</h2><p>Esses dados identificam você nos ambientes da plataforma.</p></header><form onSubmit={salvarDados}><div className="admin-account-fields"><label>Nome completo<input value={nome} onChange={(evento) => { setNome(evento.target.value); setErroNome(null); setAviso(null); }} aria-invalid={erroNome ? 'true' : undefined} />{erroNome && <small className="admin-account-field-error">{erroNome}</small>}</label><label>E-mail<input type="email" value={usuario?.email ?? ''} readOnly aria-readonly="true" /><small>O e-mail não pode ser alterado por aqui.</small></label></div><div className="admin-account-actions"><button type="button" className="admin-button admin-button-secondary" disabled={!alterado || salvando} onClick={() => { setNome(usuario?.nome ?? ''); setErroNome(null); }}>Cancelar</button><button type="submit" className="admin-button admin-button-primary" disabled={!alterado || salvando}>{salvando ? 'Salvando...' : 'Salvar alterações'}</button></div></form></article></>}
        {aba === 'seguranca' && <article className="admin-account-section"><header><h2>Alterar senha</h2><p>Use uma senha forte e diferente das utilizadas em outros serviços.</p></header><form onSubmit={alterarSenha}><div className="admin-account-fields admin-password-fields"><CampoSenha rotulo="Senha atual" valor={senhaAtual} aoAlterar={(valor) => { setSenhaAtual(valor); setErrosSenha((atuais) => ({ ...atuais, senhaAtual: '' })); }} erro={errosSenha.senhaAtual} mostrar={mostrarSenhas} /><CampoSenha rotulo="Nova senha" valor={novaSenha} aoAlterar={(valor) => { setNovaSenha(valor); setErrosSenha((atuais) => ({ ...atuais, novaSenha: '' })); }} erro={errosSenha.novaSenha} mostrar={mostrarSenhas} ajuda={<RequisitosSenha senha={novaSenha} />} ajudaInvalida={novaSenha.length > 0 && Boolean(validarNovaSenha(novaSenha))} /><CampoSenha rotulo="Confirmar nova senha" valor={confirmacao} aoAlterar={(valor) => { setConfirmacao(valor); setErrosSenha((atuais) => ({ ...atuais, confirmacao: '' })); }} erro={erroConfirmacao} mostrar={mostrarSenhas} /></div><label className="admin-checkbox admin-show-password"><input type="checkbox" checked={mostrarSenhas} onChange={(evento) => setMostrarSenhas(evento.target.checked)} />{mostrarSenhas ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}Mostrar senhas</label><div className="admin-account-actions"><button type="button" className="admin-button admin-button-secondary" disabled={trocando} onClick={() => { setSenhaAtual(''); setNovaSenha(''); setConfirmacao(''); setErrosSenha({}); }}>Cancelar</button><button type="submit" className="admin-button admin-button-primary" disabled={trocando}>{trocando ? 'Alterando...' : 'Alterar senha'}</button></div></form></article>}
      </div>
    </section>
  );
}

function CampoSenha({ rotulo, valor, aoAlterar, erro, mostrar, ajuda, ajudaInvalida = false }: { rotulo: string; valor: string; aoAlterar: (valor: string) => void; erro?: string; mostrar: boolean; ajuda?: ReactNode; ajudaInvalida?: boolean }) {
  const invalido = Boolean(erro) || ajudaInvalida;
  return <label>{rotulo}<input type={mostrar ? 'text' : 'password'} value={valor} onChange={(evento) => aoAlterar(evento.target.value)} aria-invalid={invalido ? 'true' : undefined} />{erro && <small className="admin-account-field-error">{erro}</small>}{ajuda}</label>;
}

function RequisitosSenha({ senha }: { senha: string }) {
  const digitando = senha.length > 0;
  const requisitos = [
    ['Entre 8 e 72 caracteres', senha.length >= 8 && senha.length <= 72],
    ['Uma letra maiúscula', /[A-Z]/.test(senha)],
    ['Uma letra minúscula', /[a-z]/.test(senha)],
    ['Um número', /[0-9]/.test(senha)],
    ['Um caractere especial', /[^A-Za-z0-9\s]/.test(senha)],
  ] as const;
  return <ul className="admin-password-requirements" aria-live="polite">{requisitos.map(([texto, atendido]) => <li className={atendido ? 'valid' : digitando ? 'invalid' : ''} key={texto}>{texto}</li>)}</ul>;
}

function validarNovaSenha(senha: string): string | undefined {
  if (senha.length < 8 || senha.length > 72 || !/[A-Z]/.test(senha) || !/[a-z]/.test(senha) || !/[0-9]/.test(senha) || !/[^A-Za-z0-9\s]/.test(senha)) {
    return ORIENTACAO_SENHA;
  }
}

function iniciais(nome?: string) {
  return nome?.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || 'AD';
}

function rotulosPerfis(papeis?: string[]) {
  const mapa: Record<string, string> = { ADMINISTRADOR: 'Administrador', ORGANIZADOR: 'Organizador', JOGADOR: 'Jogador' };
  return papeis?.map((papel) => mapa[papel] ?? papel).join(' e ') || 'Administrador';
}
