import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "wouter";
import { ImageIcon, Upload, Printer } from "lucide-react";

// Interface para as impressoras do sistema
interface PrinterInfo {
  name: string;
  isDefault: boolean;
}

export default function Settings() {
  const [settings, setSettings] = useState({
    companyName: "",
    totemTitle: "",
    displayPanelTitle: "",
    historyItemCount: "5",
    logoUrl: "",
    printerEnabled: "true",
    printerName: "",
    ticketWidth: "80",
    ticketHeight: "200",
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  
  // Fetch current settings
  const { data: currentSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['/api/settings'],
  });
  
  // Fetch printers
  const { data: printers = [] as PrinterInfo[], isLoading: isLoadingPrinters } = useQuery<PrinterInfo[]>({
    queryKey: ['/api/printers'],
    enabled: settings.printerEnabled === "true"
  });
  
  const isLoading = isLoadingSettings || isLoadingPrinters;
  
  // Update settings when data loads
  useEffect(() => {
    if (currentSettings) {
      setSettings({
        companyName: currentSettings.companyName || "",
        totemTitle: currentSettings.totemTitle || "",
        displayPanelTitle: currentSettings.displayPanelTitle || "",
        historyItemCount: currentSettings.historyItemCount || "5",
        logoUrl: currentSettings.logoUrl || "",
        printerEnabled: currentSettings.printerEnabled || "true",
        printerName: currentSettings.printerName || "",
        ticketWidth: currentSettings.ticketWidth || "80",
        ticketHeight: currentSettings.ticketHeight || "200",
      });
    }
  }, [currentSettings]);
  
  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Record<string, string>) => {
      const response = await apiRequest("PUT", "/api/settings", newSettings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Configurações salvas",
        description: "As configurações foram atualizadas com sucesso",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar configurações",
        description: error.message || "Não foi possível salvar as configurações",
      });
    },
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle file upload for logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast({
        variant: "destructive",
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 2MB",
      });
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Formato inválido",
        description: "Por favor, selecione uma imagem",
      });
      return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setSettings(prev => ({ ...prev, logoUrl: base64String }));
    };
    reader.readAsDataURL(file);
  };
  
  // Trigger file input click
  const handleLogoButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleSaveSettings = () => {
    // Validate historyItemCount is a positive integer
    const historyCount = parseInt(settings.historyItemCount);
    if (isNaN(historyCount) || historyCount <= 0) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: "O número de itens no histórico deve ser um número positivo",
      });
      return;
    }
    
    updateSettingsMutation.mutate(settings);
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
        <Link href="/">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="text-center py-4">Carregando configurações...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <Input
                id="companyName"
                name="companyName"
                value={settings.companyName}
                onChange={handleInputChange}
                placeholder="Nome da sua empresa"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="totemTitle">Título do Totem</Label>
              <Input
                id="totemTitle"
                name="totemTitle"
                value={settings.totemTitle}
                onChange={handleInputChange}
                placeholder="Ex: Geração de Senha"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="displayPanelTitle">Título do Painel de Chamada</Label>
              <Input
                id="displayPanelTitle"
                name="displayPanelTitle"
                value={settings.displayPanelTitle}
                onChange={handleInputChange}
                placeholder="Ex: Painel de Chamada"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="historyItemCount">Quantidade de Itens no Histórico</Label>
              <Input
                id="historyItemCount"
                name="historyItemCount"
                type="number"
                min="1"
                max="10"
                value={settings.historyItemCount}
                onChange={handleInputChange}
                placeholder="Ex: 5"
              />
              <p className="text-sm text-gray-500">
                Número de senhas a serem exibidas no histórico do painel de chamada
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="logo">Logo da Empresa</Label>
              <div className="flex items-center gap-4">
                {settings.logoUrl ? (
                  <div className="h-16 w-40 bg-accent rounded flex items-center justify-center overflow-hidden">
                    <img 
                      src={settings.logoUrl} 
                      alt="Logo da empresa" 
                      className="max-h-full max-w-full object-contain" 
                    />
                  </div>
                ) : (
                  <div className="h-16 w-40 bg-accent rounded flex items-center justify-center text-primary font-bold">
                    <ImageIcon className="h-6 w-6 mr-2" />
                    LOGO
                  </div>
                )}
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={handleLogoButtonClick}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {settings.logoUrl ? "Trocar Logo" : "Adicionar Logo"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="logo"
                  name="logo"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-500">
                Upload de imagem para a logo da empresa. Tamanho máximo: 2MB.
              </p>
            </div>
            
            <Separator className="my-4" />
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Printer className="h-5 w-5" /> 
                Configurações de Impressão
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Configure a impressão automática de senhas no totem.
              </p>
            </div>
            
            <div className="flex items-center justify-between space-x-2 mb-4">
              <Label htmlFor="printerEnabled" className="flex flex-col space-y-1">
                <span>Habilitar Impressão Automática</span>
                <span className="font-normal text-sm text-gray-500">Imprimir senhas automaticamente ao serem geradas</span>
              </Label>
              <Switch
                id="printerEnabled"
                name="printerEnabled"
                checked={settings.printerEnabled === "true"}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, printerEnabled: checked ? "true" : "false" }))}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="printerName">Impressora</Label>
              <Select 
                value={settings.printerName} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, printerName: value }))}
                disabled={settings.printerEnabled !== "true"}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma impressora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Impressora Padrão do Sistema</SelectItem>
                  {printers.map((printer) => (
                    <SelectItem key={printer.name} value={printer.name}>
                      {printer.name} {printer.isDefault ? "(Padrão)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                Selecione a impressora que será usada para imprimir as senhas.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="ticketWidth">Largura do Ticket (mm)</Label>
                <Input
                  id="ticketWidth"
                  name="ticketWidth"
                  type="number"
                  value={settings.ticketWidth}
                  onChange={handleInputChange}
                  min="50"
                  max="200"
                  disabled={settings.printerEnabled !== "true"}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="ticketHeight">Altura do Ticket (mm)</Label>
                <Input
                  id="ticketHeight"
                  name="ticketHeight"
                  type="number"
                  value={settings.ticketHeight}
                  onChange={handleInputChange}
                  min="100"
                  max="300"
                  disabled={settings.printerEnabled !== "true"}
                />
              </div>
            </div>
            
            <div className="pt-4">
              <Button
                onClick={handleSaveSettings}
                disabled={updateSettingsMutation.isPending}
                className="bg-primary hover:bg-accent-foreground"
              >
                {updateSettingsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
