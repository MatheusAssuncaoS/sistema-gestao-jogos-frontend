import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface SheetProps {
  aberto: boolean;
  aoAlterar: (aberto: boolean) => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
}

export function Sheet({ aberto, aoAlterar, titulo, descricao, children }: SheetProps) {
  return (
    <Dialog.Root open={aberto} onOpenChange={aoAlterar}>
      <Dialog.Portal>
        <Dialog.Overlay className="ui-dialog-overlay" />
        <Dialog.Content className="ui-sheet-content">
          <header className="ui-sheet-header">
            <div><Dialog.Title>{titulo}</Dialog.Title>{descricao && <Dialog.Description>{descricao}</Dialog.Description>}</div>
            <Dialog.Close className="ui-icon-button" aria-label="Fechar"><X aria-hidden="true" /></Dialog.Close>
          </header>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
