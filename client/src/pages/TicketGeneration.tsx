import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import TicketPreview from "@/components/TicketPreview";
import Logo from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";
import { Printer } from "lucide-react";

export default function TicketGeneration() {
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Fetch settings
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
  });
  
  // Check if printing is enabled
  const printingEnabled = settings?.printerEnabled === "true";
  
  // Clear ticket preview after 10 seconds
  useEffect(() => {
    if (showTicket) {
      const timer = setTimeout(() => {
        setShowTicket(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [showTicket]);
  
  // Function to print ticket
  const printTicket = () => {
    if (!currentTicket || !ticketRef.current) return;
    
    try {
      setIsPrinting(true);
      
      // Get printer settings
      const printerName = settings?.printerName || '';
      const width = parseInt(settings?.ticketWidth || '80');
      const height = parseInt(settings?.ticketHeight || '200');
      
      // Create print window
      const printWindow = window.open('', 'PRINT', `width=${width},height=${height}`);
      if (!printWindow) {
        toast({
          variant: "destructive",
          title: "Erro de impressão",
          description: "Não foi possível abrir a janela de impressão.",
        });
        setIsPrinting(false);
        return;
      }
      
      // Get HTML content of ticket
      const ticketContent = ticketRef.current.innerHTML;
      
      // Create print document
      printWindow.document.write(`
        <html>
          <head>
            <title>Impressão de Senha</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                width: ${width}mm;
                font-family: Arial, sans-serif;
              }
              .ticket-print {
                width: 100%;
                max-width: ${width}mm;
                padding: 5mm;
                box-sizing: border-box;
              }
              img { max-width: 100%; }
              @media print {
                body { width: ${width}mm; }
                .ticket-print { width: 100%; }
              }
            </style>
          </head>
          <body>
            <div class="ticket-print">${ticketContent}</div>
          </body>
        </html>
      `);
      
      // Set printer name if specified
      if (printerName) {
        try {
          const printSettings = { printer: printerName };
          (printWindow as any).print(printSettings);
        } catch (e) {
          console.error('Erro ao configurar impressora específica:', e);
          printWindow.print();
        }
      } else {
        // Use default printer
        printWindow.print();
      }
      
      // Close print window after printing
      printWindow.onafterprint = () => {
        printWindow.close();
        setIsPrinting(false);
      };
      
      // Fallback in case onafterprint doesn't fire
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          printWindow.close();
        }
        setIsPrinting(false);
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      toast({
        variant: "destructive",
        title: "Erro de impressão",
        description: "Não foi possível imprimir a senha.",
      });
      setIsPrinting(false);
    }
  };
  
  const generateTicket = async (type: "normal" | "priority") => {
    try {
      const response = await apiRequest("POST", "/api/tickets", { type });
      const ticket = await response.json();
      
      const ticketData = {
        ...ticket,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      };
      
      setCurrentTicket(ticketData);
      setShowTicket(true);
      
      // Verifica se o ticket foi impresso no servidor
      const wasServerPrinted = !!ticket.printed;
      
      // Exibe mensagem adequada
      toast({
        title: "Senha gerada com sucesso!",
        description: wasServerPrinted 
          ? `Sua senha ${ticket.code} foi impressa automaticamente` 
          : `Sua senha é ${ticket.code}`,
      });
      
      // Print ticket automaticamente no cliente apenas se habilitado E não foi impresso no servidor
      if (printingEnabled && !wasServerPrinted) {
        // Delay slightly to ensure the ref is available
        setTimeout(() => {
          printTicket();
        }, 100);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao gerar senha",
        description: "Não foi possível gerar uma nova senha.",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-white p-4 flex flex-col items-center">
      <header className="w-full flex justify-between items-center mb-8">
        <Logo />
        
        <h1 className="text-2xl font-bold text-accent-foreground">
          {settings?.totemTitle || "Geração de Senha"}
        </h1>
      </header>
      
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        <h2 className="text-xl text-center mb-8">Selecione o tipo de atendimento:</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <Button 
            onClick={() => generateTicket("priority")}
            size="lg"
            className="bg-primary hover:bg-accent-foreground text-white font-bold py-8 px-4 text-xl shadow-md"
          >
            Prioritário
          </Button>
          
          <Button 
            onClick={() => generateTicket("normal")}
            size="lg"
            className="bg-secondary hover:bg-primary text-white font-bold py-8 px-4 text-xl shadow-md"
          >
            Normal
          </Button>
        </div>
      </div>
      
      {/* Ticket Preview */}
      {showTicket && currentTicket && (
        <TicketPreview 
          ticket={currentTicket} 
          companyName={settings?.companyName || "AtendeFácil"} 
          componentRef={ticketRef}
        />
      )}
      
      {/* Printing status indicator - visualmente oculto mas mostra status */}
      {isPrinting && (
        <div className="fixed bottom-4 right-4 bg-accent text-accent-foreground px-4 py-2 rounded-md shadow-md flex items-center gap-2 animate-pulse">
          <Printer className="h-5 w-5" />
          <span>Imprimindo...</span>
        </div>
      )}
    </div>
  );
}
