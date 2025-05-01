import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import Logo from "@/components/Logo";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!username || !password) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, preencha todos os campos."
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/auth/login", { username, password });
      const data = await response.json();
      
      // Invalidate user query to refresh auth state
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo(a), ${data.name}`
      });
      
      // Redirect to home page
      setLocation("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Usuário ou senha inválidos."
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-neutral">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex justify-center mb-6">
            <Logo className="h-16 w-40" />
          </div>
          
          <h1 className="text-2xl font-bold text-center text-accent-foreground mb-6">
            AtendeFácil
          </h1>
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <Label htmlFor="username" className="block text-sm font-medium mb-1">
                Usuário
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                className="w-full p-3"
                disabled={isLoading}
              />
            </div>
            
            <div className="mb-6">
              <Label htmlFor="password" className="block text-sm font-medium mb-1">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full p-3"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-accent-foreground py-3"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
