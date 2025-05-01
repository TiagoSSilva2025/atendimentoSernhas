import { Card, CardContent } from "@/components/ui/card";

interface QueueStatsProps {
  stats?: {
    waiting: {
      normal: number;
      priority: number;
    };
    next: {
      normal: string | null;
      priority: string | null;
    };
  };
}

export default function QueueStats({ stats }: QueueStatsProps) {
  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4">Filas de Atendimento</h2>
          <div className="text-center py-4">Carregando estatísticas...</div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-4">Filas de Atendimento</h2>
        
        <div className="space-y-4">
          <div className="bg-accent rounded-lg p-4">
            <h3 className="font-medium mb-2">Fila Prioritária</h3>
            <div className="flex justify-between items-center">
              <span>Aguardando:</span>
              <span className="text-2xl font-bold text-primary">{stats.waiting.priority}</span>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Próxima senha: <span>{stats.next.priority || "Nenhuma"}</span>
            </div>
          </div>
          
          <div className="bg-neutral rounded-lg p-4">
            <h3 className="font-medium mb-2">Fila Normal</h3>
            <div className="flex justify-between items-center">
              <span>Aguardando:</span>
              <span className="text-2xl font-bold text-primary">{stats.waiting.normal}</span>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Próxima senha: <span>{stats.next.normal || "Nenhuma"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
