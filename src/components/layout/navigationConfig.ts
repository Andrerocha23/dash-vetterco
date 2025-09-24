import { 
  LayoutDashboard, 
  Users, 
  LineChart, 
  Blocks, 
  GraduationCap, 
  Briefcase, 
  ShieldCheck, 
  MessageSquare,
  Webhook
} from "lucide-react";
import { pt } from "@/i18n/pt";

export const navigationItems = [
  { title: pt.nav.dashboard, url: "/dashboard", icon: LayoutDashboard },
  { title: pt.nav.clients, url: "/clientes", icon: Users },
  { title: pt.nav.templates, url: "/templates", icon: Blocks },
  { title: pt.nav.training, url: "/capacitacao", icon: GraduationCap },
  { title: pt.nav.managers, url: "/gestores", icon: Briefcase },
  { title: pt.nav.users, url: "/usuarios", icon: ShieldCheck },
  { title: pt.nav.feedbacks, url: "/feedbacks", icon: MessageSquare },
  { title: pt.nav.reportN8n, url: "/relatorio-n8n", icon: Webhook },
];