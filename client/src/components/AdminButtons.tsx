import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { UsersIcon, LayoutDashboardIcon, HistoryIcon, SettingsIcon, BarChart4Icon } from "lucide-react";

interface AdminButtonsProps {
  onToggleHistory?: () => void;
}

export default function AdminButtons({ onToggleHistory }: AdminButtonsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Link href="/admin/users">
        <Button
          variant="outline"
          className="w-full h-24 border-primary text-primary hover:bg-accent flex flex-col items-center justify-center"
        >
          <UsersIcon className="h-6 w-6 mb-2" />
          Usuários
        </Button>
      </Link>
      
      <Link href="/admin/counters">
        <Button
          variant="outline"
          className="w-full h-24 border-primary text-primary hover:bg-accent flex flex-col items-center justify-center"
        >
          <LayoutDashboardIcon className="h-6 w-6 mb-2" />
          Guichês
        </Button>
      </Link>
      
      <Link href="/admin/reports">
        <Button
          variant="outline"
          className="w-full h-24 border-primary text-primary hover:bg-accent flex flex-col items-center justify-center"
        >
          <BarChart4Icon className="h-6 w-6 mb-2" />
          Relatórios
        </Button>
      </Link>
      
      <Button
        variant="outline"
        className="w-full h-24 border-primary text-primary hover:bg-accent flex flex-col items-center justify-center"
        onClick={onToggleHistory}
      >
        <HistoryIcon className="h-6 w-6 mb-2" />
        Histórico
      </Button>
      
      <Link href="/admin/settings">
        <Button
          variant="outline"
          className="w-full h-24 border-primary text-primary hover:bg-accent flex flex-col items-center justify-center"
        >
          <SettingsIcon className="h-6 w-6 mb-2" />
          Configurações
        </Button>
      </Link>
    </div>
  );
}
