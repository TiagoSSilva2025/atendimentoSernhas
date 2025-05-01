import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(date?: Date | string | null): string {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "HH:mm - dd/MM/yyyy");
  } catch (error) {
    return "";
  }
}

export function formatTime(date?: Date | string | null): string {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "HH:mm");
  } catch (error) {
    return "";
  }
}

export function formatDate(date?: Date | string | null): string {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "dd/MM/yyyy");
  } catch (error) {
    return "";
  }
}

export function getTicketPrefix(type: string): string {
  return type === "priority" ? "P" : "A";
}

export function formatTicketNumber(number: number): string {
  return number.toString().padStart(3, "0");
}

export function createTicketCode(type: string, number: number): string {
  const prefix = getTicketPrefix(type);
  const formattedNumber = formatTicketNumber(number);
  return `${prefix}-${formattedNumber}`;
}

export function getTicketTypeLabel(type: string): string {
  return type === "priority" ? "Prioritário" : "Normal";
}

export function getTicketClassName(type: string): string {
  return type === "priority" 
    ? "bg-green-100 text-green-800" 
    : "bg-blue-100 text-blue-800";
}
