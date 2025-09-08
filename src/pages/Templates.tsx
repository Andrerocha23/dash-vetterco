import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Blocks, Plus, Eye, Copy, Edit } from "lucide-react";
import { pt } from "@/i18n/pt";

export default function Templates() {
  const mockTemplates = [
    { id: "1", name: "Relatório Diário de Performance", category: "daily-report", channel: "whatsapp" },
    { id: "2", name: "Alerta de Saldo Baixo", category: "balance-alert", channel: "whatsapp" },
    { id: "3", name: "Follow-up de Lead Qualificado", category: "lead-followup", channel: "whatsapp" }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{pt.templates.title}</h1>
            <p className="text-muted-foreground mt-1">{pt.templates.subtitle}</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {pt.templates.newTemplate}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTemplates.map((template) => (
            <Card key={template.id} className="surface-elevated">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <Blocks className="h-5 w-5 text-primary" />
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">{template.category}</Badge>
                  <Badge variant="outline">{template.channel}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    {pt.actions.preview}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-1" />
                    {pt.actions.duplicate}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    {pt.actions.edit}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}