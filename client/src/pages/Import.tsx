import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ExcelImport } from '@/components/ExcelImport';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { type Lead } from '@/lib/types';

interface ImportHistory {
  id: string;
  fileName: string;
  date: Date;
  imported: number;
  skipped: number;
  status: 'success' | 'partial' | 'failed';
}

interface ImportedLead {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
  notes?: string;
}

interface ConflictItem {
  imported: ImportedLead;
  existing: Lead;
  action: 'skip' | 'overwrite';
}

export default function Import() {
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [history, setHistory] = useState<ImportHistory[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const { data: existingLeads = [] } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  const createLeadMutation = useMutation({
    mutationFn: async (lead: ImportedLead) => {
      const response = await apiRequest('POST', '/api/leads', {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone || '',
        source: lead.source || 'Excel Import',
        notes: lead.notes || '',
        status: 'Nowy',
        assignedToId: null,
      });
      return response.json();
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async ({ id, lead }: { id: string; lead: ImportedLead }) => {
      const response = await apiRequest('PATCH', `/api/leads/${id}`, {
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone || '',
        source: lead.source || '',
        notes: lead.notes || '',
      });
      return response.json();
    },
  });

  const handleImport = async (leads: ImportedLead[], conflicts: ConflictItem[]) => {
    setIsImporting(true);
    let importedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    try {
      for (const lead of leads) {
        try {
          await createLeadMutation.mutateAsync(lead);
          importedCount++;
        } catch (error) {
          failedCount++;
        }
      }

      for (const conflict of conflicts) {
        if (conflict.action === 'overwrite') {
          try {
            await updateLeadMutation.mutateAsync({
              id: conflict.existing.id,
              lead: conflict.imported,
            });
            importedCount++;
          } catch (error) {
            failedCount++;
          }
        } else {
          skippedCount++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['/api/leads'] });

      const newEntry: ImportHistory = {
        id: String(Date.now()),
        fileName: 'import_' + new Date().toISOString().split('T')[0] + '.xlsx',
        date: new Date(),
        imported: importedCount,
        skipped: skippedCount,
        status: failedCount > 0 ? 'partial' : skippedCount > 0 ? 'partial' : 'success',
      };

      setHistory(prev => [newEntry, ...prev]);

      toast({
        title: 'Import zakonczony',
        description: `Zaimportowano ${importedCount} leadow${skippedCount > 0 ? `, pominieto ${skippedCount}` : ''}${failedCount > 0 ? `, bledy: ${failedCount}` : ''}`,
      });
    } catch (error) {
      toast({
        title: 'Blad importu',
        description: 'Wystapil blad podczas importu leadow',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getStatusIcon = (status: ImportHistory['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'partial': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: ImportHistory['status']) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Sukces</Badge>;
      case 'partial': return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">Czesciowo</Badge>;
      case 'failed': return <Badge variant="destructive">Blad</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-6" data-testid="import-page">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Import leadow</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Importuj leady z plikow Excel
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="p-6 rounded-full bg-primary/10 mb-4">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Wgraj plik Excel</h3>
            <p className="text-sm text-muted-foreground mb-2 max-w-md">
              Wgraj plik Excel (.xlsx lub .xls) z leadami.
              System automatycznie wykryje duplikaty i pozwoli wybrac jak je obsluzyc.
            </p>
            <p className="text-xs text-muted-foreground mb-6 max-w-md">
              Format pliku: kolumny "Imie nazwisko", "Telefon", "e-mail", "Zrodlo"
            </p>
            <Button 
              onClick={() => setImportModalOpen(true)} 
              size="lg" 
              disabled={isImporting}
              data-testid="button-start-import"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4 mr-2" />
              )}
              {isImporting ? 'Importowanie...' : 'Wybierz plik do importu'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-muted-foreground" />
            Historia importow
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Brak importow</p>
            </div>
          ) : (
            <div className="divide-y">
              {history.map((item) => (
                <div key={item.id} className="flex items-center gap-4 py-4" data-testid={`import-history-${item.id}`}>
                  {getStatusIcon(item.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.fileName}</p>
                    <p className="text-sm text-muted-foreground font-mono">
                      {item.date.toLocaleDateString('pl-PL')} o {item.date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      <span className="font-medium text-green-600 dark:text-green-400">{item.imported}</span> zaimportowano
                    </p>
                    {item.skipped > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {item.skipped} pominieto
                      </p>
                    )}
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ExcelImport
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        existingLeads={existingLeads}
        onImport={handleImport}
      />
    </div>
  );
}
