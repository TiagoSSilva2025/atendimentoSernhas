import { 
  users, type User, type InsertUser,
  counters, type Counter, type InsertCounter,
  tickets, type Ticket, type InsertTicket,
  settings, type Setting, type InsertSetting
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Counter methods
  getCounter(id: number): Promise<Counter | undefined>;
  getCounters(): Promise<Counter[]>;
  getActiveCounters(): Promise<Counter[]>;
  createCounter(counter: InsertCounter): Promise<Counter>;
  updateCounter(id: number, counter: Partial<Counter>): Promise<Counter | undefined>;
  deleteCounter(id: number): Promise<boolean>;

  // Ticket methods
  getTicket(id: number): Promise<Ticket | undefined>;
  getTicketByCode(code: string): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, ticket: Partial<Ticket>): Promise<Ticket | undefined>;
  getWaitingTickets(type?: string): Promise<Ticket[]>;
  getTicketHistory(limit?: number): Promise<Ticket[]>;
  getNextTicketNumber(type: string): Promise<number>;

  // Settings methods
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(key: string, value: string): Promise<Setting>;
  getSettings(): Promise<Setting[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private counters: Map<number, Counter>;
  private tickets: Map<number, Ticket>;
  private settings: Map<string, Setting>;
  
  private userIdCounter: number;
  private counterIdCounter: number;
  private ticketIdCounter: number;
  private settingIdCounter: number;
  
  private normalTicketCounter: number;
  private priorityTicketCounter: number;

  constructor() {
    this.users = new Map();
    this.counters = new Map();
    this.tickets = new Map();
    this.settings = new Map();
    
    this.userIdCounter = 1;
    this.counterIdCounter = 1;
    this.ticketIdCounter = 1;
    this.settingIdCounter = 1;
    
    this.normalTicketCounter = 1;
    this.priorityTicketCounter = 1;
    
    // Init with default admin user
    this.createUser({
      username: "admin",
      password: "admin", // In production, this would be hashed
      name: "Administrator",
      isAdmin: true
    });
    
    // Init with default counter
    this.createCounter({
      name: "1",
      isActive: true
    });
    
    // Init with default settings
    const defaultSettings = [
      { key: "companyName", value: "AtendeFácil" },
      { key: "totemTitle", value: "Geração de Senha" },
      { key: "displayPanelTitle", value: "Painel de Chamada" },
      { key: "historyItemCount", value: "5" },
      { key: "logoUrl", value: "" },
      { key: "printerEnabled", value: "true" },
      { key: "printerName", value: "" },
      { key: "ticketWidth", value: "80" },
      { key: "ticketHeight", value: "200" }
    ];
    
    defaultSettings.forEach(setting => {
      this.updateSetting(setting.key, setting.value);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      name: insertUser.name,
      isAdmin: insertUser.isAdmin ?? false,
      counterId: insertUser.counterId !== undefined ? insertUser.counterId : null
    };
    this.users.set(id, user);
    return user;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Counter methods
  async getCounter(id: number): Promise<Counter | undefined> {
    return this.counters.get(id);
  }
  
  async getCounters(): Promise<Counter[]> {
    return Array.from(this.counters.values());
  }
  
  async getActiveCounters(): Promise<Counter[]> {
    return Array.from(this.counters.values()).filter(counter => counter.isActive);
  }
  
  async createCounter(insertCounter: InsertCounter): Promise<Counter> {
    const id = this.counterIdCounter++;
    const counter: Counter = { 
      ...insertCounter, 
      id, 
      isActive: insertCounter.isActive ?? true
    };
    this.counters.set(id, counter);
    return counter;
  }
  
  async updateCounter(id: number, counterData: Partial<Counter>): Promise<Counter | undefined> {
    const counter = this.counters.get(id);
    if (!counter) return undefined;
    
    const updatedCounter = { ...counter, ...counterData };
    this.counters.set(id, updatedCounter);
    return updatedCounter;
  }
  
  async deleteCounter(id: number): Promise<boolean> {
    return this.counters.delete(id);
  }

  // Ticket methods
  async getTicket(id: number): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }
  
  async getTicketByCode(code: string): Promise<Ticket | undefined> {
    return Array.from(this.tickets.values()).find(
      (ticket) => ticket.code === code
    );
  }
  
  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const id = this.ticketIdCounter++;
    const ticket: Ticket = { 
      ...insertTicket, 
      id, 
      status: insertTicket.status ?? "waiting",
      createdAt: new Date(),
      calledAt: null,
      completedAt: null,
      counterId: null,
      attendantId: null
    };
    this.tickets.set(id, ticket);
    return ticket;
  }
  
  async updateTicket(id: number, ticketData: Partial<Ticket>): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;
    
    const updatedTicket = { ...ticket, ...ticketData };
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }
  
  async getWaitingTickets(type?: string): Promise<Ticket[]> {
    let tickets = Array.from(this.tickets.values())
      .filter(ticket => ticket.status === "waiting")
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    if (type) {
      tickets = tickets.filter(ticket => ticket.type === type);
    }
    
    return tickets;
  }
  
  async getTicketHistory(limit = 50): Promise<Ticket[]> {
    return Array.from(this.tickets.values())
      .filter(ticket => ticket.status === "called" || ticket.status === "completed")
      .sort((a, b) => {
        const aTime = a.calledAt?.getTime() || 0;
        const bTime = b.calledAt?.getTime() || 0;
        return bTime - aTime; // Most recent first
      })
      .slice(0, limit);
  }
  
  async getNextTicketNumber(type: string): Promise<number> {
    if (type === "priority") {
      return this.priorityTicketCounter++;
    } else {
      return this.normalTicketCounter++;
    }
  }

  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    return this.settings.get(key);
  }
  
  async updateSetting(key: string, value: string): Promise<Setting> {
    const existingSetting = this.settings.get(key);
    
    if (existingSetting) {
      const updatedSetting = { ...existingSetting, value };
      this.settings.set(key, updatedSetting);
      return updatedSetting;
    } else {
      const id = this.settingIdCounter++;
      const newSetting: Setting = { id, key, value };
      this.settings.set(key, newSetting);
      return newSetting;
    }
  }
  
  async getSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }
}

export const storage = new MemStorage();
