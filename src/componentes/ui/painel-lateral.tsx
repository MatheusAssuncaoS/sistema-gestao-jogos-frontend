import type { ReactNode } from 'react';

import { SheetContent, SheetDescription, SheetHeader, SheetRoot, SheetTitle } from './sheet';

interface SheetProps {
  aberto: boolean;
  aoAlterar: (aberto: boolean) => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
}

export function Sheet({ aberto, aoAlterar, titulo, descricao, children }: SheetProps) {
  return (
    <SheetRoot open={aberto} onOpenChange={aoAlterar}>
      <SheetContent className="ui-sheet-content">
        <SheetHeader className="ui-sheet-header">
          <SheetTitle>{titulo}</SheetTitle>
          {descricao && <SheetDescription>{descricao}</SheetDescription>}
        </SheetHeader>
        {children}
      </SheetContent>
    </SheetRoot>
  );
}
