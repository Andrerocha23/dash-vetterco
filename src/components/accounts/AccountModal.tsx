import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AccountForm, AccountFormData } from "./AccountForm";

interface AccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: AccountFormData;
  onSubmit: (data: AccountFormData) => void;
  isEdit?: boolean;
  isSubmitting?: boolean;
}

export function AccountModal({
  open,
  onOpenChange,
  account,
  onSubmit,
  isEdit = false,
  isSubmitting = false,
}: AccountModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Conta" : "Nova Conta"}
          </DialogTitle>
        </DialogHeader>
        <AccountForm
          account={account}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isEdit={isEdit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}