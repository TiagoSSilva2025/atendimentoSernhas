import { formatDate, formatTime } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import Logo from "@/components/Logo";

interface TicketPreviewProps {
  ticket: {
    code: string;
    createdAt?: string | Date;
    date?: string;
    time?: string;
    type?: string;
  };
  companyName: string;
  componentRef?: React.RefObject<HTMLDivElement>;
}

export default function TicketPreview({ ticket, companyName, componentRef }: TicketPreviewProps) {
  // Use provided date/time or format from createdAt
  const displayDate = ticket.date || (ticket.createdAt ? formatDate(ticket.createdAt) : "");
  const displayTime = ticket.time || (ticket.createdAt ? formatTime(ticket.createdAt) : "");
  
  // Fetch settings to get logoUrl
  const { data: settings } = useQuery({
    queryKey: ['/api/settings'],
  });
  
  return (
    <div ref={componentRef} className="border-2 border-gray-200 rounded-lg p-6 mt-8 w-full max-w-md animate-in fade-in duration-300">
      <div className="text-center">
        {/* Company Logo */}
        <div className="flex justify-center mb-3">
          <Logo className="h-12 w-32" />
        </div>
        <h3 className="text-lg font-bold mb-2">{companyName}</h3>
        
        <div className="bg-accent text-accent-foreground text-2xl font-bold py-4 rounded-md mb-4">
          Senha: <span>{ticket.code}</span>
        </div>
        
        <div className="flex justify-between text-sm text-gray-600">
          <span>Data: <span>{displayDate}</span></span>
          <span>Hora: <span>{displayTime}</span></span>
        </div>
        
        <p className="mt-4 font-medium">Aguarde sua vez!</p>
      </div>
    </div>
  );
}
