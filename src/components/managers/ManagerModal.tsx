import { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ManagerForm } from "./ManagerForm";
import { CreateManagerData } from "@/services/managersService";

interface ManagerModalProps {
  mode: "create" | "edit";
  manager?: CreateManagerData & { id?: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateManagerData) => void;
  trigger?: ReactNode;
  isSubmitting?: boolean;
}

export function ManagerModal({
  mode,
  manager,
  open,
  onOpenChange,
  onSubmit,
  trigger,
  isSubmitting = false,
}: ManagerModalProps) {
  const isEdit = mode === "edit";

  const handleSubmit = (data: CreateManagerData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Gestor" : "Novo Gestor"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize as informações do gestor abaixo."
              : "Preencha as informações para criar um novo gestor."
            }
          </DialogDescription>
        </DialogHeader>
        <ManagerForm
          manager={manager}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isEdit={isEdit}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}