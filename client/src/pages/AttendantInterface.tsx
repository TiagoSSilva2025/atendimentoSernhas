import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useSocketEvent } from "@/lib/socket";
import { Ticket } from "@shared/schema";
import QueueStats from "@/components/QueueStats";
import AdminButtons from "@/components/AdminButtons";
import TicketHistory from "@/components/TicketHistory";
import Logo from "@/components/Logo";

export default function AttendantInterface() {
  const [selectedCounter, setSelectedCounter] = useState<string>("");
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();
  
  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/auth/me'],
  });
  
  // Fetch counters
  const { data: counters } = useQuery({
    queryKey: ['/api/counters'],
  });
  
  // Fetch stats
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 5000,
  });
  
  // Fetch ticket history for admin
  const { data: ticketHistory } = useQuery({
    queryKey: ['/api/tickets/history'],
    enabled: showHistory && currentUser?.isAdmin,
  });
  
  // Set default counter if available
  useEffect(() => {
    if (counters && counters.length > 0 && !selectedCounter) {
      setSelectedCounter(counters[0].id.toString());
    }
  }, [counters, selectedCounter]);
  
  // Listen for ticket updates
  useSocketEvent<{ ticket: Ticket }>('ticket_called', () => {
    refetchStats();
  });
  
  useSocketEvent<{ ticket: Ticket }>('ticket_created', () => {
    refetchStats();
  });
  
  // Call next ticket mutation
  const callNextTicketMutation = useMutation({
    mutationFn: async ({ type }: { type: string }) => {
      if (!selectedCounter) {
        throw new Error("Selecione um guichê primeiro");
      }
      
      const response = await apiRequest("POST", "/api/tickets/call", { 
        type, 
        counterId: selectedCounter 
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentTicket(data);
      refetchStats();
      
      toast({
        title: "Senha chamada",
        description: `Chamando senha ${data.code} para o guichê ${selectedCounter}`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao chamar próxima senha",
        description: error.message || "Não foi possível chamar a próxima senha",
      });
    },
  });
  
  // Complete ticket mutation
  const completeTicketMutation = useMutation({
    mutationFn: async () => {
      if (!currentTicket) {
        throw new Error("Nenhuma senha em atendimento");
      }
      
      const response = await apiRequest("PUT", `/api/tickets/${currentTicket.id}/complete`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Atendimento finalizado",
        description: "A senha foi marcada como atendida",
      });
      
      setCurrentTicket(null);
      refetchStats();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao finalizar atendimento",
        description: error.message || "Não foi possível finalizar o atendimento",
      });
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/logout", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      window.location.href = "/login";
    },
  });
  
  const handleCallTicket = (type: "normal" | "priority") => {
    callNextTicketMutation.mutate({ type });
  };
  
  const handleCompleteTicket = () => {
    completeTicketMutation.mutate();
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };
  
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-primary text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Logo variant="light" className="h-12 w-32" />
          
          <h1 className="text-xl font-bold">AtendeFácil</h1>
          
          <div className="flex items-center gap-2">
            <span>{currentUser?.name}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto p-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column: Call Next Ticket */}
          <Card className="lg:w-2/3">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-6">Chamar Próxima Senha</h2>
              
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <Button
                    onClick={() => handleCallTicket("priority")}
                    className="flex-1 bg-primary hover:bg-accent-foreground"
                    disabled={callNextTicketMutation.isPending || !selectedCounter || stats?.waiting.priority === 0}
                  >
                    Chamar Próximo Prioritário
                  </Button>
                  <Button
                    onClick={() => handleCallTicket("normal")}
                    className="flex-1 bg-secondary hover:bg-primary"
                    disabled={callNextTicketMutation.isPending || !selectedCounter || stats?.waiting.normal === 0}
                  >
                    Chamar Próximo Normal
                  </Button>
                </div>
                
                {/* Current Ticket Info */}
                {currentTicket ? (
                  <div className="bg-accent rounded-lg p-6 mt-4">
                    <h3 className="text-lg font-medium mb-2">Senha Atual</h3>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-4xl font-bold text-primary">{currentTicket.code}</div>
                      
                      <div>
                        <label htmlFor="counter-select" className="block text-sm font-medium mb-1">
                          Guichê:
                        </label>
                        <Select
                          value={selectedCounter}
                          onValueChange={setSelectedCounter}
                          disabled={!counters || counters.length === 0}
                        >
                          <SelectTrigger id="counter-select" className="bg-white border border-gray-300 rounded-md focus:ring-2 focus:ring-primary">
                            <SelectValue placeholder="Selecionar guichê" />
                          </SelectTrigger>
                          <SelectContent>
                            {counters?.filter(c => c.isActive).map((counter) => (
                              <SelectItem key={counter.id} value={counter.id.toString()}>
                                {counter.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleCompleteTicket}
                      className="mt-4 w-full bg-primary hover:bg-accent-foreground"
                      disabled={completeTicketMutation.isPending}
                    >
                      Finalizar Atendimento
                    </Button>
                  </div>
                ) : (
                  <div className="bg-accent rounded-lg p-6 mt-4 text-center">
                    <p className="text-lg text-gray-600">
                      Nenhuma senha em atendimento.
                      <br />
                      Clique em "Chamar Próximo" para iniciar.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Right Column: Queue Stats */}
          <div className="lg:w-1/3">
            <QueueStats stats={stats} />
          </div>
        </div>
        
        {/* Admin Section */}
        {currentUser?.isAdmin && (
          <div className="mt-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold mb-6">Administração</h2>
                <AdminButtons onToggleHistory={toggleHistory} />
              </CardContent>
            </Card>
            
            {/* Ticket History Section */}
            {showHistory && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Histórico de Atendimentos</h3>
                    
                    <div className="flex gap-2">
                      <input 
                        type="date" 
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                      />
                      <Select>
                        <SelectTrigger className="border border-gray-300 rounded-md px-3 py-2 text-sm">
                          <SelectValue placeholder="Todos os guichês" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos os guichês</SelectItem>
                          {counters?.map(counter => (
                            <SelectItem key={counter.id} value={counter.id.toString()}>
                              Guichê {counter.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Senha</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guichê</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chamada</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atendente</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ticketHistory?.map((ticket) => (
                          <tr key={ticket.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{ticket.code}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                ticket.type === "priority" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                              }`}>
                                {ticket.type === "priority" ? "Prioritário" : "Normal"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{ticket.counterId}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {new Date(ticket.calledAt!).toLocaleTimeString()} - {new Date(ticket.calledAt!).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{ticket.attendantId}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
