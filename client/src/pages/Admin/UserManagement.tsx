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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Counter, insertUserSchema } from "@shared/schema";
import { Link } from "wouter";
import { z } from "zod";

export default function UserManagement() {
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    name: "",
    isAdmin: false,
    counterId: null as number | null,
  });
  
  const { toast } = useToast();
  
  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });
  
  // Extended schema with validation
  const userSchema = insertUserSchema.extend({
    username: z.string().min(3, "O nome de usuário deve ter no mínimo 3 caracteres"),
    password: z.string().min(4, "A senha deve ter no mínimo 4 caracteres"),
    name: z.string().min(3, "O nome completo deve ter no mínimo 3 caracteres"),
  });
  
  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: z.infer<typeof userSchema>) => {
      const response = await apiRequest("POST", "/api/users", userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsAddUserOpen(false);
      setNewUser({
        username: "",
        password: "",
        name: "",
        isAdmin: false,
      });
      
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar usuário",
        description: error.message || "Não foi possível criar o usuário",
      });
    },
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/users/${userId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao excluir usuário",
        description: error.message || "Não foi possível excluir o usuário",
      });
    },
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewUser({
      ...newUser,
      [name]: type === "checkbox" ? checked : value,
    });
  };
  
  const handleCreateUser = () => {
    try {
      const validatedData = userSchema.parse(newUser);
      createUserMutation.mutate(validatedData);
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
  
  const handleDeleteUser = (userId: number) => {
    if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteUserMutation.mutate(userId);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
        <div className="flex gap-2">
          <Link href="/">
            <Button variant="outline">Voltar</Button>
          </Link>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-accent-foreground">Adicionar Usuário</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    name="name"
                    value={newUser.name}
                    onChange={handleInputChange}
                    placeholder="Nome do usuário"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="username">Nome de Usuário</Label>
                  <Input
                    id="username"
                    name="username"
                    value={newUser.username}
                    onChange={handleInputChange}
                    placeholder="Nome de login"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={newUser.password}
                    onChange={handleInputChange}
                    placeholder="Senha do usuário"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="isAdmin"
                    name="isAdmin"
                    checked={newUser.isAdmin}
                    onCheckedChange={(checked) => 
                      setNewUser({...newUser, isAdmin: checked})
                    }
                  />
                  <Label htmlFor="isAdmin">Administrador</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateUser}
                  disabled={createUserMutation.isPending}
                  className="bg-primary hover:bg-accent-foreground"
                >
                  {createUserMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Carregando usuários...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.isAdmin ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {user.isAdmin ? "Administrador" : "Atendente"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={deleteUserMutation.isPending}
                      >
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                
                {users?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      Nenhum usuário encontrado
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
