import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// WebSocket message types
export interface SocketMessage {
  event: string;
  [key: string]: any;
}

// Utility function to get WebSocket URL
const getWebSocketUrl = () => {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
};

// Hook to subscribe to specific socket events
export function useSocketEvent<T>(eventName: string, callback: (data: T) => void) {
  useEffect(() => {
    // Create a WebSocket connection for this specific event listener
    const ws = new WebSocket(getWebSocketUrl());
    
    ws.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.event === eventName) {
          callback(data);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });
    
    // Clean up on unmount
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [eventName, callback]);
}

// Simple send message function
export const sendSocketMessage = (message: SocketMessage) => {
  const ws = new WebSocket(getWebSocketUrl());
  
  // Send message once connection is open
  ws.addEventListener("open", () => {
    ws.send(JSON.stringify(message));
    // Close connection after sending
    setTimeout(() => ws.close(), 100);
  });
  
  // Log errors
  ws.addEventListener("error", (error) => {
    console.error("WebSocket send error:", error);
  });
};

// Simplified socket hook (no context)
export function useSocket() {
  const { toast } = useToast();
  
  // Returns a function to send messages
  return {
    send: (message: SocketMessage) => {
      try {
        sendSocketMessage(message);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro na conexão",
          description: "Não foi possível enviar a mensagem.",
        });
      }
    }
  };
}
