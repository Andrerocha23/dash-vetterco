import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Calendar, TrendingDown, AlertCircle, Target, BarChart3 } from "lucide-react";

const supabase = createClient("YOUR_SUPABASE_URL", "YOUR_SUPABASE_ANON_KEY");

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
      const hoje = new Date().toISOString().split("T")[0];
      const ontem = new Date(Date.now() - 86400000).toISOString().split("T")[0];

      // 1. LEADS DE HOJE
      const { data: leadsHojeData } = await supabase
        .from("campaign_leads_daily")
        .select("leads_count")
        .eq("date", hoje);

      const totalHoje = leadsHojeData?.reduce((sum, item) => sum + (item.leads_count || 0), 0) || 0;
      setLeadsHoje(totalHoje);

      // 2. LEADS DE ONTEM (para comparação)
      const { data: leadsOntemData } = await supabase
        .from("campaign_leads_daily")
        .select("leads_count")
        .eq("date", ontem);

      const totalOntem = leadsOntemData?.reduce((sum, item) => sum + (item.leads_count || 0), 0) || 0;

      // 3. CONTAS QUE NÃO TIVERAM LEADS ONTEM
      const { data: accounts } = await supabase
        .from("accounts")
        .select("id, nome_cliente, nome_empresa, status")
        .eq("status", "Ativo");

      const { data: leadsOntem } = await supabase
        .from("campaign_leads_daily")
        .select("client_id, leads_count")
        .eq("date", ontem);

      const accountsComLeads = new Set(leadsOntem?.filter((l) => l.leads_count > 0).map((l) => l.client_id));
      const semLeadsOntem = accounts?.filter((acc) => !accountsComLeads.has(acc.id)) || [];

      setContasSemLeads(semLeadsOntem);

      // 4. CAMPANHAS QUE NÃO GERARAM LEADS ONTEM
      const { data: campanhasOntem } = await supabase
        .from("campaign_leads_daily")
        .select("campaign_name, client_id, leads_count, date")
        .eq("date", ontem)
        .eq("leads_count", 0);

      // Enriquecer com nome da conta
      const campanhasEnriquecidas = await Promise.all(
        (campanhasOntem || []).map(async (camp) => {
          const account = accounts?.find((a) => a.id === camp.client_id);
          return {
            ...camp,
            nome_conta: account?.nome_cliente || "Desconhecido",
          };
        }),
      );

      setCampanhasSemLeads(campanhasEnriquecidas);

      // 5. LEADS POR DIA DA SEMANA (últimos 30 dias)
      const data30DiasAtras = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

      const { data: leads30d } = await supabase
        .from("campaign_leads_daily")
        .select("date, leads_count")
        .gte("date", data30DiasAtras)
        .lte("date", hoje);

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
        const data = new Date(lead.date + "T00:00:00");
        const diaSemana = diasSemana[data.getDay()];
        leadsPorDia[diaSemana] += lead.leads_count || 0;
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
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-xl text-gray-600">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Performance</h1>
          <p className="text-gray-600">Análise completa de leads e campanhas</p>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Leads Hoje */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8 text-blue-600" />
              <div
                className={`text-sm font-semibold px-2 py-1 rounded ${comparativoOntem?.positivo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {comparativoOntem?.positivo ? "+" : ""}
                {comparativoOntem?.variacao}%
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{leadsHoje}</h3>
            <p className="text-sm text-gray-600 mt-1">Leads Hoje</p>
            <p className="text-xs text-gray-500 mt-2">Ontem: {comparativoOntem?.ontem}</p>
          </div>

          {/* Contas Sem Leads Ontem */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingDown className="h-8 w-8 text-orange-600" />
              <span className="text-sm font-semibold text-orange-600">{contasSemLeads.length}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{contasSemLeads.length}</h3>
            <p className="text-sm text-gray-600 mt-1">Contas sem leads ontem</p>
          </div>

          {/* Campanhas Sem Leads Ontem */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <span className="text-sm font-semibold text-red-600">{campanhasSemLeads.length}</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{campanhasSemLeads.length}</h3>
            <p className="text-sm text-gray-600 mt-1">Campanhas sem leads ontem</p>
          </div>

          {/* Melhor Dia da Semana */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8 text-green-600" />
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {leadsPorDiaSemana.length > 0
                ? leadsPorDiaSemana.reduce((max, item) => (item.leads > max.leads ? item : max)).dia
                : "-"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">Melhor dia da semana</p>
            <p className="text-xs text-gray-500 mt-2">
              {leadsPorDiaSemana.length > 0
                ? leadsPorDiaSemana.reduce((max, item) => (item.leads > max.leads ? item : max)).leads
                : 0}{" "}
              leads
            </p>
          </div>
        </div>

        {/* Gráfico - Leads por Dia da Semana */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Leads por Dia da Semana (Últimos 30 dias)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leadsPorDiaSemana}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="leads" fill="#3b82f6" radius={[8, 8, 0, 0]} />
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
