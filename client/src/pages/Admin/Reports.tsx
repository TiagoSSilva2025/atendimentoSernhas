import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Reports() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Get the date from 7 days ago in YYYY-MM-DD format
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoFormatted = sevenDaysAgo.toISOString().split('T')[0];
  
  // Set default date range if not set
  if (!startDate) setStartDate(sevenDaysAgoFormatted);
  if (!endDate) setEndDate(today);
  
  // Fetch report data
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['/api/reports', startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/reports?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error("Failed to fetch report data");
      }
      return response.json();
    },
  });
  
  // Create data for ticket type chart
  const ticketTypeData = [
    { name: "Normal", value: reportData?.byType?.normal || 0 },
    { name: "Prioritário", value: reportData?.byType?.priority || 0 },
  ];
  
  // Create data for counter chart
  const counterData = reportData?.byCounter ? 
    Object.entries(reportData.byCounter).map(([counter, count]) => ({
      name: `Guichê ${counter}`,
      atendimentos: count,
    })) : [];
  
  const handleDateChange = () => {
    refetch();
  };
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <Link href="/">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                min={startDate}
                max={today}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            
            <div className="flex items-end">
              <Button onClick={handleDateChange} className="bg-primary hover:bg-accent-foreground">
                Filtrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="text-center py-4">Carregando dados...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total de Atendimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary">{reportData?.total || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Senhas Normais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-blue-500">{reportData?.byType?.normal || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Senhas Prioritárias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">{reportData?.byType?.priority || 0}</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Atendimentos por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ticketTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Atendimentos" fill="#16a34a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Atendimentos por Guichê</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={counterData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="atendimentos" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
