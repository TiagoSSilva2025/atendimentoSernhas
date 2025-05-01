import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from "ws";
import { insertUserSchema, insertCounterSchema, insertTicketSchema } from "@shared/schema";
import session from "express-session";
import { z } from "zod";
import { getSystemPrinters, printTicket } from "./printerService";

// WebSocket connection management
let clients: WebSocket[] = [];

function broadcastToAll(message: any) {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
}

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Admin authorization middleware
const isAdmin = async (req: Request, res: Response, next: Function) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = await storage.getUser(req.session.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: "Forbidden - Admin access required" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  app.use(session({
    secret: "atendefacil-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set user in session
      req.session.userId = user.id;
      
      res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      res.status(500).json({ message: "Server error during login" });
    }
  });
  
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not logged in" });
    }
    
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      isAdmin: user.isAdmin
    });
  });

  // User management routes (admin only)
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Don't send passwords to client
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.post("/api/users", isAdmin, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(validatedData);
      
      const { password, ...safeUser } = newUser;
      res.status(201).json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  app.put("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const userData = req.body;
      const updatedUser = await storage.updateUser(id, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  app.delete("/api/users/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Don't allow deleting yourself
      if (id === req.session.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const success = await storage.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Counter management routes
  app.get("/api/counters", isAuthenticated, async (req, res) => {
    try {
      const counters = await storage.getCounters();
      res.json(counters);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch counters" });
    }
  });
  
  app.post("/api/counters", isAdmin, async (req, res) => {
    try {
      const validatedData = insertCounterSchema.parse(req.body);
      const newCounter = await storage.createCounter(validatedData);
      res.status(201).json(newCounter);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid counter data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create counter" });
    }
  });
  
  app.put("/api/counters/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid counter ID" });
      }
      
      const counterData = req.body;
      const updatedCounter = await storage.updateCounter(id, counterData);
      
      if (!updatedCounter) {
        return res.status(404).json({ message: "Counter not found" });
      }
      
      res.json(updatedCounter);
    } catch (error) {
      res.status(500).json({ message: "Failed to update counter" });
    }
  });
  
  app.delete("/api/counters/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid counter ID" });
      }
      
      const success = await storage.deleteCounter(id);
      
      if (!success) {
        return res.status(404).json({ message: "Counter not found" });
      }
      
      res.json({ message: "Counter deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete counter" });
    }
  });

  // Ticket routes
  app.post("/api/tickets", async (req, res) => {
    try {
      const { type } = req.body;
      
      if (type !== "normal" && type !== "priority") {
        return res.status(400).json({ message: "Invalid ticket type" });
      }
      
      const nextNumber = await storage.getNextTicketNumber(type);
      const prefix = type === "priority" ? "P" : "A";
      const paddedNumber = nextNumber.toString().padStart(3, "0");
      const code = `${prefix}-${paddedNumber}`;
      
      const ticketData = {
        code,
        type,
        status: "waiting"
      };
      
      const newTicket = await storage.createTicket(ticketData);
      
      // Broadcast new ticket to all clients
      broadcastToAll({
        event: "ticket_created",
        ticket: newTicket
      });
      
      // Verificar se a impressão automática está habilitada
      const printerEnabledSetting = await storage.getSetting("printerEnabled");
      const printerEnabled = printerEnabledSetting?.value === "true";
      
      // Se a impressão estiver habilitada, imprimir o ticket automaticamente
      if (printerEnabled) {
        try {
          // Buscar configurações para impressão
          const companyNameSetting = await storage.getSetting("companyName");
          const companyName = companyNameSetting?.value || "AtendeFácil";
          
          const logoUrlSetting = await storage.getSetting("logoUrl");
          const logoUrl = logoUrlSetting?.value || "";
          
          const ticketWidthSetting = await storage.getSetting("ticketWidth");
          const ticketHeightSetting = await storage.getSetting("ticketHeight");
          const width = parseInt(ticketWidthSetting?.value || "80");
          const height = parseInt(ticketHeightSetting?.value || "200");
          
          // Imprimir ticket diretamente
          await printTicket({
            code: newTicket.code,
            type: newTicket.type,
            companyName,
            logoUrl,
            width,
            height
          });
          
          // Adicionar flag de impressão ao ticket na resposta
          (newTicket as any).printed = true;
        } catch (printError) {
          console.error("Erro ao imprimir ticket automaticamente:", printError);
          // Continuar o fluxo mesmo se a impressão falhar
          // Apenas loga o erro, mas não afeta a resposta principal
        }
      }
      
      res.status(201).json(newTicket);
    } catch (error) {
      res.status(500).json({ message: "Failed to create ticket" });
    }
  });
  
  app.get("/api/tickets/waiting", isAuthenticated, async (req, res) => {
    try {
      const { type } = req.query;
      let ticketType: string | undefined;
      
      if (type === "normal" || type === "priority") {
        ticketType = type;
      }
      
      const tickets = await storage.getWaitingTickets(ticketType);
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch waiting tickets" });
    }
  });
  
  app.get("/api/tickets/history", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const history = await storage.getTicketHistory(limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ticket history" });
    }
  });
  
  app.post("/api/tickets/call", isAuthenticated, async (req, res) => {
    try {
      const { type, counterId } = req.body;
      
      if (!counterId) {
        return res.status(400).json({ message: "Counter ID is required" });
      }
      
      if (type !== "normal" && type !== "priority") {
        return res.status(400).json({ message: "Invalid ticket type" });
      }
      
      // Get next waiting ticket of specified type
      const waitingTickets = await storage.getWaitingTickets(type);
      if (waitingTickets.length === 0) {
        return res.status(404).json({ message: "No waiting tickets of specified type" });
      }
      
      const nextTicket = waitingTickets[0];
      
      // Update ticket
      const updatedTicket = await storage.updateTicket(nextTicket.id, {
        status: "called",
        calledAt: new Date(),
        counterId: parseInt(counterId as string),
        attendantId: req.session.userId
      });
      
      if (!updatedTicket) {
        return res.status(500).json({ message: "Failed to update ticket" });
      }
      
      // Broadcast called ticket to all clients
      broadcastToAll({
        event: "ticket_called",
        ticket: updatedTicket
      });
      
      res.json(updatedTicket);
    } catch (error) {
      res.status(500).json({ message: "Failed to call next ticket" });
    }
  });
  
  app.put("/api/tickets/:id/complete", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
      
      const ticket = await storage.getTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      if (ticket.status !== "called") {
        return res.status(400).json({ message: "Ticket is not in called status" });
      }
      
      const updatedTicket = await storage.updateTicket(id, {
        status: "completed",
        completedAt: new Date()
      });
      
      if (!updatedTicket) {
        return res.status(500).json({ message: "Failed to complete ticket" });
      }
      
      // Broadcast completed ticket to all clients
      broadcastToAll({
        event: "ticket_completed",
        ticket: updatedTicket
      });
      
      res.json(updatedTicket);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete ticket" });
    }
  });

  // Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      
      // Convert array to object for easier client consumption
      const settingsObj = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);
      
      res.json(settingsObj);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });
  
  app.put("/api/settings", isAdmin, async (req, res) => {
    try {
      const settingsData = req.body;
      
      if (!settingsData || typeof settingsData !== "object") {
        return res.status(400).json({ message: "Invalid settings data" });
      }
      
      const updatedSettings: Record<string, string> = {};
      
      for (const [key, value] of Object.entries(settingsData)) {
        if (typeof value !== "string") continue;
        
        const setting = await storage.updateSetting(key, value);
        updatedSettings[setting.key] = setting.value;
      }
      
      // Broadcast settings update to all clients
      broadcastToAll({
        event: "settings_updated",
        settings: updatedSettings
      });
      
      res.json(updatedSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Printer routes
  app.get("/api/printers", async (req, res) => {
    try {
      const printers = await getSystemPrinters();
      res.json(printers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get system printers" });
    }
  });

  app.post("/api/tickets/:id/print", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ticket ID" });
      }
      
      const ticket = await storage.getTicket(id);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Get company name from settings
      const companyNameSetting = await storage.getSetting("companyName");
      const companyName = companyNameSetting?.value || "AtendeFácil";
      
      // Get logo from settings
      const logoUrlSetting = await storage.getSetting("logoUrl");
      const logoUrl = logoUrlSetting?.value || "";
      
      // Get ticket dimensions from settings
      const ticketWidthSetting = await storage.getSetting("ticketWidth");
      const ticketHeightSetting = await storage.getSetting("ticketHeight");
      const width = parseInt(ticketWidthSetting?.value || "80");
      const height = parseInt(ticketHeightSetting?.value || "200");
      
      // Print ticket
      const success = await printTicket({
        code: ticket.code,
        type: ticket.type,
        companyName,
        logoUrl,
        width,
        height
      });
      
      if (success) {
        res.json({ success: true, message: "Ticket printed successfully" });
      } else {
        res.status(500).json({ success: false, message: "Failed to print ticket" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to print ticket" });
    }
  });

  // Stats route for dashboard
  app.get("/api/stats", isAuthenticated, async (req, res) => {
    try {
      const normal = await storage.getWaitingTickets("normal");
      const priority = await storage.getWaitingTickets("priority");
      
      const nextNormal = normal.length > 0 ? normal[0].code : null;
      const nextPriority = priority.length > 0 ? priority[0].code : null;
      
      res.json({
        waiting: {
          normal: normal.length,
          priority: priority.length,
        },
        next: {
          normal: nextNormal,
          priority: nextPriority
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Reports route
  app.get("/api/reports", isAdmin, async (req, res) => {
    try {
      const history = await storage.getTicketHistory(1000); // Get a large history for reports
      
      // Parse dates if provided
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      
      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
        // Set to end of day
        endDate.setHours(23, 59, 59, 999);
      }
      
      // Filter by date if provided
      let filteredHistory = history;
      if (startDate && !isNaN(startDate.getTime())) {
        filteredHistory = filteredHistory.filter(ticket => 
          ticket.calledAt && ticket.calledAt >= startDate!
        );
      }
      
      if (endDate && !isNaN(endDate.getTime())) {
        filteredHistory = filteredHistory.filter(ticket => 
          ticket.calledAt && ticket.calledAt <= endDate!
        );
      }
      
      // Group by type
      const byType = {
        normal: filteredHistory.filter(ticket => ticket.type === "normal").length,
        priority: filteredHistory.filter(ticket => ticket.type === "priority").length
      };
      
      // Group by counter
      const byCounter: Record<number, number> = {};
      filteredHistory.forEach(ticket => {
        if (ticket.counterId) {
          byCounter[ticket.counterId] = (byCounter[ticket.counterId] || 0) + 1;
        }
      });
      
      // Group by attendant
      const byAttendant: Record<number, number> = {};
      filteredHistory.forEach(ticket => {
        if (ticket.attendantId) {
          byAttendant[ticket.attendantId] = (byAttendant[ticket.attendantId] || 0) + 1;
        }
      });
      
      res.json({
        total: filteredHistory.length,
        byType,
        byCounter,
        byAttendant
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    clients.push(ws);
    
    ws.on('message', (message) => {
      // Handle incoming messages if needed
      console.log('Received message from client');
    });
    
    ws.on('close', () => {
      clients = clients.filter(client => client !== ws);
    });
  });

  return httpServer;
}
