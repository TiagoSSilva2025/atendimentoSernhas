import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import TicketGeneration from "@/pages/TicketGeneration";
import DisplayPanel from "@/pages/DisplayPanel";
import AttendantInterface from "@/pages/AttendantInterface";
import UserManagement from "@/pages/Admin/UserManagement";
import CounterManagement from "@/pages/Admin/CounterManagement";
import Reports from "@/pages/Admin/Reports";
import Settings from "@/pages/Admin/Settings";
import RequireAuth from "@/components/RequireAuth";
import AdminRoute from "@/components/AdminRoute";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/totem" component={TicketGeneration} />
      <Route path="/display" component={DisplayPanel} />
      
      {/* Protected routes */}
      <Route path="/">
        <RequireAuth>
          <AttendantInterface />
        </RequireAuth>
      </Route>
      
      {/* Admin routes */}
      <Route path="/admin/users">
        <AdminRoute>
          <UserManagement />
        </AdminRoute>
      </Route>
      
      <Route path="/admin/counters">
        <AdminRoute>
          <CounterManagement />
        </AdminRoute>
      </Route>
      
      <Route path="/admin/reports">
        <AdminRoute>
          <Reports />
        </AdminRoute>
      </Route>
      
      <Route path="/admin/settings">
        <AdminRoute>
          <Settings />
        </AdminRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
