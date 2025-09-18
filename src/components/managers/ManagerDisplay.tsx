import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useClientManagers } from "@/hooks/useClientManagers";

interface ManagerDisplayProps {
  managerId: string;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  showDepartment?: boolean;
  variant?: "default" | "compact" | "full";
}

export function ManagerDisplay({ 
  managerId, 
  size = "md", 
  showName = true, 
  showDepartment = false,
  variant = "default"
}: ManagerDisplayProps) {
  const { getManagerById, getManagerName, getManagerAvatar } = useClientManagers();
  
  const manager = getManagerById(managerId);
  const managerName = getManagerName(managerId);
  const managerAvatar = getManagerAvatar(managerId);
  
  if (!manager && managerName === 'Gestor não encontrado') {
    return <span className="text-muted-foreground">Sem gestor</span>;
  }

  const avatarSizes = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm", 
    lg: "h-10 w-10 text-base"
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        <Avatar className={avatarSizes[size]}>
          {manager?.avatar_url ? (
            <AvatarImage src={manager.avatar_url} />
          ) : (
            <AvatarFallback className="bg-primary/10">
              {typeof managerAvatar === 'string' && managerAvatar.length === 1 
                ? managerAvatar 
                : managerName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        {showName && (
          <span className={`font-medium ${textSizes[size]}`}>
            {managerName}
          </span>
        )}
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div className="flex items-center gap-3">
        <Avatar className={avatarSizes[size]}>
          {manager?.avatar_url ? (
            <AvatarImage src={manager.avatar_url} />
          ) : (
            <AvatarFallback className="bg-primary/10">
              {typeof managerAvatar === 'string' && managerAvatar.length === 1 
                ? managerAvatar 
                : managerName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex flex-col">
          <span className={`font-medium ${textSizes[size]}`}>
            {managerName}
          </span>
          {showDepartment && manager?.department && (
            <span className="text-xs text-muted-foreground">
              {manager.department}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="flex items-center gap-2">
      <Avatar className={avatarSizes[size]}>
        {manager?.avatar_url ? (
          <AvatarImage src={manager.avatar_url} />
        ) : (
          <AvatarFallback className="bg-primary/10">
            {typeof managerAvatar === 'string' && managerAvatar.length === 1 
              ? managerAvatar 
              : managerName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        )}
      </Avatar>
      {showName && (
        <div>
          <span className={`font-medium ${textSizes[size]}`}>
            {managerName}
          </span>
          {showDepartment && manager?.department && (
            <div className="text-xs text-muted-foreground">
              {manager.department}
            </div>
          )}
        </div>
      )}
    </div>
  );
}