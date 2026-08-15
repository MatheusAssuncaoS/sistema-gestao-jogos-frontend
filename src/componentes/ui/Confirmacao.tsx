import * as AlertDialog from '@radix-ui/react-alert-dialog';
import type { ReactNode } from 'react';

interface ConfirmacaoProps {
  acionador: ReactNode;
  titulo: string;
  descricao: string;
  rotuloConfirmacao: string;
  processando?: boolean;
  aoConfirmar: () => void;
}

export function Confirmacao({ acionador, titulo, descricao, rotuloConfirmacao, processando, aoConfirmar }: ConfirmacaoProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{acionador}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="ui-dialog-overlay" />
        <AlertDialog.Content className="ui-alert-content">
          <AlertDialog.Title>{titulo}</AlertDialog.Title>
          <AlertDialog.Description>{descricao}</AlertDialog.Description>
          <div className="ui-alert-actions">
            <AlertDialog.Cancel className="admin-button admin-button-secondary">Cancelar</AlertDialog.Cancel>
            <AlertDialog.Action className="admin-button admin-button-danger" disabled={processando} onClick={aoConfirmar}>{processando ? 'Processando...' : rotuloConfirmacao}</AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
