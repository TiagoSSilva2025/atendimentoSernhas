import ThermalPrinter from 'node-thermal-printer';
import { format } from 'date-fns';
import { storage } from './storage';

interface PrintTicketOptions {
  code: string;
  type: string;
  companyName?: string;
  logoUrl?: string;
  width?: number;
  height?: number;
}

interface SystemPrinter {
  name: string;
  isDefault: boolean;
}

// Função para obter lista de impressoras do sistema
export async function getSystemPrinters(): Promise<SystemPrinter[]> {
  try {
    // No ambiente Node.js, não temos acesso direto a todas as impressoras do sistema
    // Então retornamos uma impressora genérica e a impressora padrão
    return [
      { name: 'Default Printer', isDefault: true },
      { name: 'Generic / Text Only', isDefault: false },
      { name: 'Microsoft Print to PDF', isDefault: false },
      { name: 'Microsoft XPS Document Writer', isDefault: false }
    ];
  } catch (error) {
    console.error('Erro ao obter impressoras:', error);
    return [{ name: 'Default Printer', isDefault: true }];
  }
}

// Função para imprimir ticket
export async function printTicket(options: PrintTicketOptions): Promise<boolean> {
  const { code, type, companyName = 'AtendeFácil', logoUrl, width = 80, height = 200 } = options;
  
  try {
    // Buscar configurações de impressora
    const printerEnabled = await storage.getSetting('printerEnabled');
    if (printerEnabled?.value !== 'true') {
      console.log('Impressão desativada nas configurações');
      return false;
    }
    
    const printerName = await storage.getSetting('printerName');
    
    // Inicializar impressora
    const printer = new ThermalPrinter.printer({
      type: ThermalPrinter.types.EPSON, // Tipo padrão de impressora térmica
      interface: printerName?.value ? `printer:${printerName.value}` : 'printer:Default Printer',
      width: width, // Largura do papel em mm
      characterSet: 'PC858' as any, // Conjunto de caracteres para suportar acentuação
      removeSpecialCharacters: false,
      options: {
        timeout: 5000
      },
    });
    
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      console.error('Impressora não conectada');
      return false;
    }
    
    // Formatar data e hora
    const now = new Date();
    const dateStr = format(now, 'dd/MM/yyyy');
    const timeStr = format(now, 'HH:mm:ss');
    
    // Design do ticket
    printer.alignCenter();
    
    // Cabeçalho com logo se disponível
    if (logoUrl) {
      try {
        await printer.printImage(logoUrl);
      } catch (e) {
        console.error('Erro ao imprimir logo:', e);
        // Continua imprimindo sem a logo
      }
    }
    
    // Nome da empresa
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println(companyName);
    printer.bold(false);
    printer.newLine();
    
    // Código da senha
    printer.bold(true);
    printer.setTextSize(2, 2);
    printer.println(`SENHA`);
    printer.setTextSize(3, 3);
    printer.println(code);
    printer.setTextSize(1, 1);
    printer.bold(false);
    
    // Tipo de atendimento
    const typeLabel = type === 'priority' ? 'PRIORITÁRIO' : 'NORMAL';
    printer.newLine();
    printer.println(`Atendimento ${typeLabel}`);
    printer.newLine();
    
    // Data e hora
    printer.println(`Data: ${dateStr}`);
    printer.println(`Hora: ${timeStr}`);
    printer.newLine();
    
    // Mensagem de rodapé
    printer.alignCenter();
    printer.println('Aguarde sua vez!');
    printer.println('Obrigado pela preferência.');
    
    // Cortar papel
    printer.cut();
    
    // Executar impressão
    await printer.execute();
    console.log(`Ticket ${code} impresso com sucesso`);
    return true;
    
  } catch (error) {
    console.error('Erro ao imprimir ticket:', error);
    return false;
  }
}
