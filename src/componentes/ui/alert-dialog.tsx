import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import type * as React from 'react';

import { cn } from '@/lib/utils';
import { buttonVariants } from './button-variants';

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;

function AlertDialogContent({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return <AlertDialogPrimitive.Portal><AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50" /><div className="ui-alert-positioner"><AlertDialogPrimitive.Content className={cn('grid w-full max-w-lg gap-4 rounded-lg border bg-background p-6 shadow-lg', className)} {...props} /></div></AlertDialogPrimitive.Portal>;
}
const AlertDialogHeader = ({ className, ...props }: React.ComponentProps<'div'>) => <div className={cn('flex flex-col gap-2 text-center sm:text-left', className)} {...props} />;
const AlertDialogFooter = ({ className, ...props }: React.ComponentProps<'div'>) => <div className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />;
const AlertDialogTitle = ({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) => <AlertDialogPrimitive.Title className={cn('text-lg font-semibold', className)} {...props} />;
const AlertDialogDescription = ({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Description>) => <AlertDialogPrimitive.Description className={cn('text-sm text-muted-foreground', className)} {...props} />;
const AlertDialogAction = ({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Action>) => <AlertDialogPrimitive.Action className={cn(buttonVariants(), className)} {...props} />;
const AlertDialogCancel = ({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) => <AlertDialogPrimitive.Cancel className={cn(buttonVariants({ variant: 'outline' }), className)} {...props} />;

export { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel };
