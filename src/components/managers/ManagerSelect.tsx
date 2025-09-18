import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useClientManagers } from "@/hooks/useClientManagers";

interface ManagerSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  showClientCount?: boolean;
  disabled?: boolean;
}

export function ManagerSelect({ 
  value, 
  onValueChange, 
  placeholder = "Selecione um gestor",
  showClientCount = true,
  disabled = false
}: ManagerSelectProps) {
  const { managers, loading } = useClientManagers();

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || loading}>
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Carregando..." : placeholder} />
      </SelectTrigger>
      <SelectContent>
        {managers.map((manager) => (
          <SelectItem key={manager.id} value={manager.id}>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                {manager.avatar_url ? (
                  <AvatarImage src={manager.avatar_url} />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-xs">
                    {manager.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{manager.name}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {manager.department && (
                    <span>({manager.department})</span>
                  )}
                  {showClientCount && manager.email && (
                    <span>- Email: {manager.email}</span>
                  )}
                </div>
              </div>
            </div>
          </SelectItem>
        ))}
        {managers.length === 0 && !loading && (
          <SelectItem value="no-managers" disabled>
            Nenhum gestor disponível
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}