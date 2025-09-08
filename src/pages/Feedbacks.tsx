import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { feedbacksService } from "@/mocks/feedbacksService";
import { Lead, LeadFilters, FeedbackPayload } from "@/types/feedback";
import { FeedbackStats } from "@/components/feedbacks/FeedbackStats";
import { FeedbackFilters } from "@/components/feedbacks/FeedbackFilters";
import { FeedbackTable } from "@/components/feedbacks/FeedbackTable";
import { FeedbackModal } from "@/components/feedbacks/FeedbackModal";


export default function Feedbacks() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<LeadFilters>({});
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackPayload>({
    status: "Pendente",
    etapa: "Novo",
    nota: 3,
    tags: [],
    comentario: "",
    anexos: []
  });
  const [stats, setStats] = useState({
    total: 0,
    qualificados: 0,
    desqualificados: 0,
    convertidos: 0,
    pendentes: 0
  });

  const { toast } = useToast();

  const loadLeads = async () => {
    setLoading(true);
    try {
      const [leadsData, statsData] = await Promise.all([
        feedbacksService.listLeads(filters),
        feedbacksService.getLeadStats(filters)
      ]);
      setLeads(leadsData);
      setStats(statsData);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os leads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [filters]);

  const handleOpenFeedback = (lead: Lead) => {
    setSelectedLead(lead);
    setFeedbackForm(lead.feedback || {
      status: lead.status,
      etapa: "Novo",
      nota: 3,
      tags: [],
      comentario: "",
      anexos: []
    });
    setFeedbackModal(true);
  };

  const handleFeedbackFormChange = (form: FeedbackPayload) => {
    setFeedbackForm(form);
  };

  const handleSaveFeedback = async () => {
    if (!selectedLead) return;
    
    try {
      await feedbacksService.updateFeedback(selectedLead.id, feedbackForm);
      await loadLeads();
      setFeedbackModal(false);
      toast({
        title: "Sucesso",
        description: "Feedback atualizado com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro", 
        description: "Erro ao salvar feedback",
        variant: "destructive"
      });
    }
  };

  const handleExport = async () => {
    try {
      await feedbacksService.exportCsv(filters);
      toast({
        title: "Sucesso",
        description: "CSV exportado com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar CSV",
        variant: "destructive"
      });
    }
  };


  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Feedbacks</h1>
            <p className="text-muted-foreground">Gerencie leads e feedback de qualidade</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span> CSV
            </Button>
          </div>
        </div>

        <FeedbackStats stats={stats} />

        <FeedbackFilters filters={filters} onFiltersChange={setFilters} />

        <FeedbackTable 
          leads={leads} 
          loading={loading} 
          onOpenFeedback={handleOpenFeedback} 
        />

        <FeedbackModal
          open={feedbackModal}
          onOpenChange={setFeedbackModal}
          selectedLead={selectedLead}
          feedbackForm={feedbackForm}
          onFeedbackFormChange={handleFeedbackFormChange}
          onSave={handleSaveFeedback}
        />
      </div>
    </AppLayout>
  );
}