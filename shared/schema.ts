import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Counters/guichês table
export const counters = pgTable("counters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertCounterSchema = createInsertSchema(counters).pick({
  name: true,
  isActive: true,
});

export type InsertCounter = z.infer<typeof insertCounterSchema>;
export type Counter = typeof counters.$inferSelect;

// Users table for attendants and administrators
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  counterId: integer("counter_id").references(() => counters.id),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  isAdmin: true,
  counterId: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Tickets table
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // Format: A-001, P-001, etc.
  type: text("type").notNull(), // "normal" or "priority"
  status: text("status").notNull().default("waiting"), // "waiting", "called", "completed"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  calledAt: timestamp("called_at"),
  completedAt: timestamp("completed_at"),
  counterId: integer("counter_id").references(() => counters.id),
  attendantId: integer("attendant_id").references(() => users.id),
});

export const insertTicketSchema = createInsertSchema(tickets).pick({
  code: true,
  type: true,
  status: true,
});

export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;

// System settings table
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const insertSettingSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;
