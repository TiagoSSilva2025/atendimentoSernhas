import { Ticket } from "@shared/schema";

interface TicketHistoryProps {
  tickets: Ticket[];
}

export default function TicketHistory({ tickets }: TicketHistoryProps) {
  if (!tickets || tickets.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        Sem histórico de chamadas
      </div>
    );
  }
  
  return (
    <div className="divide-y divide-gray-200">
      {tickets.map((ticket) => (
        <div key={ticket.id} className="py-4 flex justify-between">
          <span className="font-medium">{ticket.code}</span>
          <span>
            Guichê: <span className="font-medium">{ticket.counterId}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
