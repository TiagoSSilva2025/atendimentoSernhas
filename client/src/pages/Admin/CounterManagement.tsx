import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Counter, insertCounterSchema } from "@shared/schema";
import { Link } from "wouter";
import { z } from "zod";

export default function CounterManagement() {
  const [isAddCounterOpen, setIsAddCounterOpen] = useState(false);
  const [newCounter, setNewCounter] = useState({
    name: "",
    isActive: true,
  });
  
  const { toast } = useToast();
  
  // Fetch counters
  const { data: counters, isLoading } = useQuery<Counter[]>({
    queryKey: ['/api/counters'],
  });
  
  // Extended schema with validation
  const counterSchema = insertCounterSchema.extend({
    name: z.string().min(1, "O nome do guichê é obrigatório"),
  });
  
  // Create counter mutation
  const createCounterMutation = useMutation({
    mutationFn: async (counterData: z.infer<typeof counterSchema>) => {
      const response = await apiRequest("POST", "/api/counters", counterData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/counters'] });
      setIsAddCounterOpen(false);
      setNewCounter({
        name: "",
        isActive: true,
      });
      
      toast({
        title: "Guichê criado",
        description: "O guichê foi criado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar guichê",
        description: error.message || "Não foi possível criar o guichê",
      });
    },
  });
  
  // Update counter mutation
  const updateCounterMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Counter> }) => {
      const response = await apiRequest("PUT", `/api/counters/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/counters'] });
      toast({
        title: "Guichê atualizado",
        description: "O guichê foi atualizado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar guichê",
        description: error.message || "Não foi possível atualizar o guichê",
      });
    },
  });
  
  // Delete counter mutation
  const deleteCounterMutation = useMutation({
    mutationFn: async (counterId: number) => {
      const response = await apiRequest("DELETE", `/api/counters/${counterId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/counters'] });
      toast({
        title: "Guichê excluído",
        description: "O guichê foi excluído com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir guichê",
        description: error.message || "Não foi possível excluir o guichê",
      });
    },
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewCounter({
      ...newCounter,
      [name]: type === "checkbox" ? checked : value,
    });
  };
  
  const handleCreateCounter = () => {
    try {
      const validatedData = counterSchema.parse(newCounter);
      createCounterMutation.mutate(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors[0]?.message || "Dados inválidos";
        toast({
          variant: "destructive",
          title: "Erro de validação",
          description: errorMessage,
        });
      }
    }
  };
  
  const handleToggleActive = (counter: Counter) => {
    updateCounterMutation.mutate({
      id: counter.id,
      data: { isActive: !counter.isActive },
    });
  };
  
  const handleDeleteCounter = (counterId: number) => {
    if (window.confirm("Tem certeza que deseja excluir este guichê?")) {
      deleteCounterMutation.mutate(counterId);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Guichês</h1>
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="outline">Voltar</Button>
          </Link>
          <Dialog open={isAddCounterOpen} onOpenChange={setIsAddCounterOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-accent-foreground">Adicionar Guichê</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Guichê</DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome/Número do Guichê</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newCounter.name}
                    onChange={handleInputChange}
                    placeholder="Ex: 1, 2, A, B..."
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="isActive"
                    name="isActive"
                    checked={newCounter.isActive}
                    onCheckedChange={(checked) => 
                      setNewCounter({...newCounter, isActive: checked})
                    }
                  />
                  <Label htmlFor="isActive">Ativo</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddCounterOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateCounter}
                  disabled={createCounterMutation.isPending}
                  className="bg-primary hover:bg-accent-foreground"
                >
                  {createCounterMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Guichês</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Carregando guichês...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome/Número</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {counters?.map((counter) => (
                  <TableRow key={counter.id}>
                    <TableCell className="font-medium">{counter.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={counter.isActive}
                          onCheckedChange={() => handleToggleActive(counter)}
                          disabled={updateCounterMutation.isPending}
                        />
                        <span className={counter.isActive ? "text-green-600" : "text-gray-500"}>
                          {counter.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteCounter(counter.id)}
                        disabled={deleteCounterMutation.isPending}
                      >
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                
                {counters?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      Nenhum guichê encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
