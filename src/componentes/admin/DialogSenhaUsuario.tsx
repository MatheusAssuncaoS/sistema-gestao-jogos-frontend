import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { adminJogadorService } from '../../servicos/adminJogadorService';
import { ApiError } from '../../servicos/api';
import type { UsuarioResumo } from '../../servicos/tipos';
import { validarSenha } from '../../validacao/cadastro';
const mensagemDeErro = (erro: unknown) => erro instanceof ApiError ? erro.detail : 'Não foi possível redefinir a senha. Tente novamente.';
function gerarSenha() {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const valores = new Uint32Array(10);
  crypto.getRandomValues(valores);
  return `Aa1!${Array.from(valores, (valor) => caracteres[valor % caracteres.length]).join('')}`;
}

export function DialogSenhaUsuario({ aberto, aoAlterar, usuario, aoConcluir }: { aberto: boolean; aoAlterar: (aberto: boolean) => void; usuario: UsuarioResumo; aoConcluir: () => void }) {
  const [senha, setSenha] = useState('');
  const [exigirTroca, setExigirTroca] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function submeter(evento: FormEvent) {
    evento.preventDefault();
    const falhaValidacao = validarSenha(senha);
    if (falhaValidacao) { setErro(falhaValidacao); return; }
    setEnviando(true);
    setErro(null);
    try {
      await adminJogadorService.redefinirSenha(usuario.id, { novaSenha: senha, exigirTrocaNoProximoLogin: exigirTroca });
      aoConcluir();
      aoAlterar(false);
      setSenha('');
    } catch (falha) {
      setErro(mensagemDeErro(falha));
    } finally {
      setEnviando(false);
    }
  }

  return <Dialog.Root open={aberto} onOpenChange={aoAlterar}><Dialog.Portal><Dialog.Overlay className="ui-dialog-overlay ui-dialog-overlay-nested" /><Dialog.Content className="ui-alert-content admin-password-dialog"><header><div><Dialog.Title>Redefinir senha</Dialog.Title><Dialog.Description>Configure uma nova senha para {usuario.nome}.</Dialog.Description></div><Dialog.Close className="ui-icon-button" aria-label="Fechar"><X /></Dialog.Close></header><form onSubmit={submeter}><label>Nova senha<div className="admin-password-field"><input value={senha} onChange={(evento) => { setSenha(evento.target.value); setErro(null); }} /><button type="button" className="admin-button admin-button-secondary" onClick={() => { setSenha(gerarSenha()); setErro(null); }}>Gerar</button></div></label>{erro && <p className="admin-sheet-error" role="alert">{erro}</p>}<label className="admin-checkbox"><input type="checkbox" checked={exigirTroca} onChange={(evento) => setExigirTroca(evento.target.checked)} />Exigir troca no próximo login</label><div className="ui-alert-actions"><Dialog.Close className="admin-button admin-button-secondary" disabled={enviando}>Cancelar</Dialog.Close><button className="admin-button admin-button-primary" disabled={enviando}>{enviando ? 'Redefinindo...' : 'Redefinir senha'}</button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
