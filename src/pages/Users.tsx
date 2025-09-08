import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ShieldCheck, Plus, Edit, RotateCcw } from "lucide-react";
import { pt } from "@/i18n/pt";

export default function Users() {
  const mockUsers = [
    { id: "1", name: "Ana Silva", email: "ana.silva@metaflow.com", role: "administrator", status: "active" },
    { id: "2", name: "Carlos Santos", email: "carlos.santos@metaflow.com", role: "manager", status: "active" },
    { id: "3", name: "Mariana Costa", email: "mariana.costa@metaflow.com", role: "manager", status: "active" },
    { id: "4", name: "Pedro Oliveira", email: "pedro.oliveira@metaflow.com", role: "standard", status: "active" }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{pt.users.title}</h1>
            <p className="text-muted-foreground mt-1">{pt.users.subtitle}</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {pt.users.newUser}
          </Button>
        </div>

        <Card className="surface-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Lista de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 font-medium">Usuário</th>
                    <th className="text-left py-3 font-medium">Email</th>
                    <th className="text-center py-3 font-medium">Papel</th>
                    <th className="text-center py-3 font-medium">Status</th>
                    <th className="text-center py-3 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border/50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">{user.email}</td>
                      <td className="text-center py-3">
                        <Badge variant="outline">
                          {pt.users[user.role as keyof typeof pt.users]}
                        </Badge>
                      </td>
                      <td className="text-center py-3">
                        <Badge variant={user.status === "active" ? "default" : "secondary"}>
                          {pt.status[user.status as keyof typeof pt.status]}
                        </Badge>
                      </td>
                      <td className="text-center py-3">
                        <div className="flex justify-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}