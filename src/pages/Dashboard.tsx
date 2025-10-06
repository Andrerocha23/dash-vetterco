import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Calendar, TrendingDown, AlertCircle, Target, BarChart3 } from "lucide-react";

const DashboardAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [leadsHoje, setLeadsHoje] = useState(0);
  const [contasSemLeads, setContasSemLeads] = useState([]);
  const [campanhasSemLeads, setCampanhasSemLeads] = useState([]);
  const [leadsPorDiaSemana, setLeadsPorDiaSemana] = useState([]);
  const [comparativoOntem, setComparativoOntem] = useState(null);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      const data30DiasAtras = new Date(hoje);
      data30DiasAtras.setDate(data30DiasAtras.getDate() - 30);

      // 1. LEADS DE HOJE
      const { data: leadsHojeData } = await supabase
        .from("leads")
        .select("id")
        .gte("created_at", hoje.toISOString());

      const totalHoje = leadsHojeData?.length || 0;
      setLeadsHoje(totalHoje);

      // 2. LEADS DE ONTEM (para comparação)
      const { data: leadsOntemData } = await supabase
        .from("leads")
        .select("id")
        .gte("created_at", ontem.toISOString())
        .lt("created_at", hoje.toISOString());

      const totalOntem = leadsOntemData?.length || 0;

      // 3. CONTAS QUE NÃO TIVERAM LEADS ONTEM
      const { data: accounts } = await supabase
        .from("accounts")
        .select("id, nome_cliente, nome_empresa, status")
        .eq("status", "Ativo");

      const { data: leadsOntem } = await supabase
        .from("leads")
        .select("client_id")
        .gte("created_at", ontem.toISOString())
        .lt("created_at", hoje.toISOString());

      const accountsComLeads = new Set(leadsOntem?.map((l) => l.client_id));
      const semLeadsOntem = accounts?.filter((acc) => !accountsComLeads.has(acc.id)) || [];

      setContasSemLeads(semLeadsOntem);

      // 4. CAMPANHAS QUE NÃO GERARAM LEADS ONTEM
      const { data: todasCampanhas } = await supabase
        .from("leads")
        .select("campanha, client_id")
        .not("campanha", "is", null)
        .lt("created_at", hoje.toISOString());

      const campanhasUnicas = [...new Set(todasCampanhas?.map((l) => `${l.campanha}|${l.client_id}`))];

      const { data: campanhasComLeadsOntem } = await supabase
        .from("leads")
        .select("campanha, client_id")
        .gte("created_at", ontem.toISOString())
        .lt("created_at", hoje.toISOString())
        .not("campanha", "is", null);

      const campanhasComLeadsSet = new Set(
        campanhasComLeadsOntem?.map((l) => `${l.campanha}|${l.client_id}`)
      );

      const campanhasSemLeadsOntem = campanhasUnicas
        .filter((c) => !campanhasComLeadsSet.has(c))
        .map((c) => {
          const [campanha, client_id] = c.split("|");
          const account = accounts?.find((a) => a.id === client_id);
          return {
            campaign_name: campanha,
            client_id,
            nome_conta: account?.nome_cliente || "Desconhecido",
          };
        })
        .slice(0, 20);

      setCampanhasSemLeads(campanhasSemLeadsOntem);

      // 5. LEADS POR DIA DA SEMANA (últimos 30 dias)
      const { data: leads30d } = await supabase
        .from("leads")
        .select("created_at")
        .gte("created_at", data30DiasAtras.toISOString());

      // Agrupar por dia da semana
      const leadsPorDia = {
        Domingo: 0,
        Segunda: 0,
        Terça: 0,
        Quarta: 0,
        Quinta: 0,
        Sexta: 0,
        Sábado: 0,
      };

      const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

      leads30d?.forEach((lead) => {
        const data = new Date(lead.created_at);
        const diaSemana = diasSemana[data.getDay()];
        leadsPorDia[diaSemana] += 1;
      });

      const dadosGrafico = Object.entries(leadsPorDia).map(([dia, total]) => ({
        dia,
        leads: total,
      }));

      setLeadsPorDiaSemana(dadosGrafico);

      // Comparativo
      const variacao = totalOntem > 0 ? ((totalHoje - totalOntem) / totalOntem) * 100 : 0;
      setComparativoOntem({
        ontem: totalOntem,
        hoje: totalHoje,
        variacao: variacao.toFixed(1),
        positivo: variacao >= 0,
      });
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-xl text-muted-foreground">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card rounded-lg shadow p-6 border">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard de Performance</h1>
          <p className="text-muted-foreground">Análise completa de leads e campanhas</p>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Leads Hoje */}
          <div className="bg-card rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8 text-primary" />
              <div
                className={`text-sm font-semibold px-2 py-1 rounded ${comparativoOntem?.positivo ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}
              >
                {comparativoOntem?.positivo ? "+" : ""}
                {comparativoOntem?.variacao}%
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground">{leadsHoje}</h3>
            <p className="text-sm text-muted-foreground mt-1">Leads Hoje</p>
            <p className="text-xs text-muted-foreground mt-2">Ontem: {comparativoOntem?.ontem}</p>
          </div>

          {/* Contas Sem Leads Ontem */}
          <div className="bg-card rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between mb-4">
              <TrendingDown className="h-8 w-8 text-orange-500" />
              <span className="text-sm font-semibold text-orange-500">{contasSemLeads.length}</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">{contasSemLeads.length}</h3>
            <p className="text-sm text-muted-foreground mt-1">Contas sem leads ontem</p>
          </div>

          {/* Campanhas Sem Leads Ontem */}
          <div className="bg-card rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <span className="text-sm font-semibold text-destructive">{campanhasSemLeads.length}</span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">{campanhasSemLeads.length}</h3>
            <p className="text-sm text-muted-foreground mt-1">Campanhas sem leads ontem</p>
          </div>

          {/* Melhor Dia da Semana */}
          <div className="bg-card rounded-lg shadow p-6 border">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8 text-green-600 dark:text-green-500" />
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              {leadsPorDiaSemana.length > 0
                ? leadsPorDiaSemana.reduce((max, item) => (item.leads > max.leads ? item : max)).dia
                : "-"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Melhor dia da semana</p>
            <p className="text-xs text-muted-foreground mt-2">
              {leadsPorDiaSemana.length > 0
                ? leadsPorDiaSemana.reduce((max, item) => (item.leads > max.leads ? item : max)).leads
                : 0}{" "}
              leads
            </p>
          </div>
        </div>

        {/* Gráfico - Leads por Dia da Semana */}
        <div className="bg-card rounded-lg shadow p-6 border">
          <h2 className="text-xl font-bold text-foreground mb-6">Leads por Dia da Semana (Últimos 30 dias)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leadsPorDiaSemana}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="dia" className="text-muted-foreground" />
              <YAxis className="text-muted-foreground" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem'
                }}
              />
              <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tabelas Lado a Lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contas Sem Leads Ontem */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contas Sem Leads Ontem</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-semibold text-gray-700">Conta</th>
                    <th className="text-left py-2 text-sm font-semibold text-gray-700">Empresa</th>
                  </tr>
                </thead>
                <tbody>
                  {contasSemLeads.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-gray-500">
                        Todas as contas geraram leads ontem! 🎉
                      </td>
                    </tr>
                  ) : (
                    contasSemLeads.map((conta) => (
                      <tr key={conta.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 text-sm text-gray-900">{conta.nome_cliente}</td>
                        <td className="py-3 text-sm text-gray-600">{conta.nome_empresa}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Campanhas Sem Leads Ontem */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Campanhas Sem Leads Ontem</h2>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-semibold text-gray-700">Campanha</th>
                    <th className="text-left py-2 text-sm font-semibold text-gray-700">Conta</th>
                  </tr>
                </thead>
                <tbody>
                  {campanhasSemLeads.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-gray-500">
                        Todas as campanhas geraram leads ontem! 🎉
                      </td>
                    </tr>
                  ) : (
                    campanhasSemLeads.map((campanha, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-3 text-sm text-gray-900">{campanha.campaign_name}</td>
                        <td className="py-3 text-sm text-gray-600">{campanha.nome_conta}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Botão Atualizar */}
        <div className="flex justify-center">
          <button
            onClick={carregarDados}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors"
          >
            Atualizar Dados
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalytics;
