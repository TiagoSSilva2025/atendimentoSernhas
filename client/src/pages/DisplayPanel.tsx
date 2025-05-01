import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useSocketEvent } from "@/lib/socket";
import { queryClient } from "@/lib/queryClient";
import { Ticket } from "@shared/schema";
import Logo from "@/components/Logo";
import TicketHistory from "@/components/TicketHistory";

export default function DisplayPanel() {
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  
  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
  });
  
  // Fetch latest ticket history
  const { data: ticketHistory } = useQuery({
    queryKey: ['/api/tickets/history'],
    refetchInterval: 5000,
  });
  
  // Determine history limit from settings
  const historyLimit = settings?.historyItemCount 
    ? parseInt(settings.historyItemCount) 
    : 5;
  
  // Listen for ticket_called events
  useSocketEvent<{ ticket: Ticket }>('ticket_called', (data) => {
    setCurrentTicket(data.ticket);
    // Invalidate ticket history to refresh the list
    queryClient.invalidateQueries({ queryKey: ['/api/tickets/history'] });
  });
  
  // Set current ticket from history on initial load
  useEffect(() => {
    if (ticketHistory && ticketHistory.length > 0 && !currentTicket) {
      setCurrentTicket(ticketHistory[0]);
    }
  }, [ticketHistory, currentTicket]);
  
  return (
    <div className="min-h-screen bg-white p-4 flex flex-col">
      <header className="w-full flex justify-between items-center mb-8">
        <Logo />
        
        <h1 className="text-2xl font-bold text-accent-foreground">
          {settings?.displayPanelTitle || "Painel de Chamada"}
        </h1>
      </header>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Current Ticket Display */}
        <div className="bg-accent rounded-lg p-6 flex-1 flex flex-col items-center justify-center min-h-[300px]">
          <h2 className="text-xl font-bold mb-4">Senha Atual</h2>
          
          {currentTicket ? (
            <>
              <div className="text-6xl font-bold text-primary mb-6">
                {currentTicket.code}
              </div>
              
              <div className="bg-primary text-white text-2xl font-bold px-6 py-3 rounded-md">
                Guichê: <span>{currentTicket.counterId}</span>
              </div>
            </>
          ) : (
            <div className="text-xl text-gray-500">
              Aguardando chamada de senhas...
            </div>
          )}
        </div>
        
        {/* History Panel */}
        <Card className="lg:w-1/3">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Histórico</h2>
            
            {ticketHistory && ticketHistory.length > 0 ? (
              <TicketHistory tickets={ticketHistory.slice(0, historyLimit)} />
            ) : (
              <div className="py-4 text-center text-gray-500">
                Sem histórico de chamadas
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
