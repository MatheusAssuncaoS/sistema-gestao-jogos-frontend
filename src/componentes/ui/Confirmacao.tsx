import type { ReactNode } from 'react';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './alert-dialog';

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
    <AlertDialog>
      <AlertDialogTrigger asChild>{acionador}</AlertDialogTrigger>
      <AlertDialogContent className="ui-alert-content">
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="ui-alert-actions">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" disabled={processando} onClick={aoConfirmar}>{processando ? 'Processando...' : rotuloConfirmacao}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
