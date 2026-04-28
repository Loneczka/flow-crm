import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Settings2 } from 'lucide-react';
import { type Lead } from '@/lib/types';

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

interface ColumnMapping {
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
  notes: string;
}

interface ExcelImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingLeads: Lead[];
  onImport: (leads: ImportedLead[], conflicts: ConflictItem[]) => void;
}

const FIELD_LABELS: Record<keyof ColumnMapping, string> = {
  fullName: 'Imie i nazwisko (pelne)',
  firstName: 'Imie',
  lastName: 'Nazwisko',
  email: 'E-mail',
  phone: 'Telefon',
  source: 'Zrodlo',
  notes: 'Notatki',
};

const AUTO_DETECT_PATTERNS: Record<keyof ColumnMapping, string[]> = {
  fullName: ['Imię nazwisko', 'Imie nazwisko', 'Imię i nazwisko', 'Imie i nazwisko', 'Full Name', 'Name', 'Nazwa', 'Klient'],
  firstName: ['firstName', 'First Name', 'first_name', 'Imię', 'Imie'],
  lastName: ['lastName', 'Last Name', 'last_name', 'Nazwisko'],
  email: ['e-mail', 'E-mail', 'email', 'Email', 'EMAIL', 'Mail', 'Adres email'],
  phone: ['Telefon', 'phone', 'Phone', 'telephone', 'Tel', 'Numer telefonu', 'Nr telefonu'],
  source: ['Źródło', 'Zrodlo', 'source', 'Source', 'Pochodzenie'],
  notes: ['Notatki', 'notatki', 'Notakta', 'notakta', 'Notatka', 'notatka', 'Uwagi', 'uwagi', 'Komentarz', 'komentarz', 'notes', 'Notes', 'Opis'],
};

export function ExcelImport({ open, onOpenChange, existingLeads, onImport }: ExcelImportProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'review'>('upload');
  const [rawData, setRawData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    fullName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: '',
    notes: '',
  });
  const [importedData, setImportedData] = useState<ImportedLead[]>([]);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [cleanData, setCleanData] = useState<ImportedLead[]>([]);
  const [fileName, setFileName] = useState('');

  const findConflicts = (data: ImportedLead[]): { clean: ImportedLead[]; conflicts: ConflictItem[] } => {
    const conflictItems: ConflictItem[] = [];
    const cleanItems: ImportedLead[] = [];

    data.forEach((item) => {
      const existing = existingLeads.find((lead) => {
        const emailMatch = item.email && lead.email && item.email.toLowerCase().trim() === lead.email.toLowerCase().trim();
        const phoneMatch = item.phone && lead.phone && item.phone.trim() === lead.phone.trim();
        return emailMatch || phoneMatch;
      });

      if (existing) {
        conflictItems.push({
          imported: item,
          existing,
          action: 'skip',
        });
      } else {
        cleanItems.push(item);
      }
    });

    return { clean: cleanItems, conflicts: conflictItems };
  };

  const autoDetectMapping = (cols: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {
      fullName: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      source: '',
      notes: '',
    };

    for (const [field, patterns] of Object.entries(AUTO_DETECT_PATTERNS)) {
      for (const pattern of patterns) {
        const match = cols.find(col => col.toLowerCase() === pattern.toLowerCase());
        if (match) {
          mapping[field as keyof ColumnMapping] = match;
          break;
        }
      }
    }

    return mapping;
  };

  const applyMapping = (data: any[], mapping: ColumnMapping): ImportedLead[] => {
    return data.map((row: any) => {
      const fullName = mapping.fullName ? row[mapping.fullName] || '' : '';
      let firstName = mapping.firstName ? row[mapping.firstName] || '' : '';
      let lastName = mapping.lastName ? row[mapping.lastName] || '' : '';

      if (fullName && (!firstName || !lastName)) {
        const nameParts = fullName.trim().split(' ').filter(Boolean);
        if (nameParts.length >= 2) {
          lastName = nameParts.pop() || '';
          firstName = nameParts.join(' ');
        } else if (nameParts.length === 1) {
          firstName = nameParts[0];
          lastName = '-';
        }
      }

      if (!firstName) firstName = '-';
      if (!lastName) lastName = '-';

      return {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        email: mapping.email ? String(row[mapping.email] || '').trim() : '',
        phone: mapping.phone ? String(row[mapping.phone] || '').trim() : '',
        source: mapping.source ? String(row[mapping.source] || 'Excel Import').trim() : 'Excel Import',
        notes: mapping.notes ? String(row[mapping.notes] || '').trim() : '',
      };
    }).filter(lead => lead.email || lead.phone);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<any>(sheet);

      if (jsonData.length === 0) return;

      const cols = Object.keys(jsonData[0]);
      setColumns(cols);
      setRawData(jsonData);

      const detectedMapping = autoDetectMapping(cols);
      setColumnMapping(detectedMapping);

      const hasNameMapping = detectedMapping.fullName || (detectedMapping.firstName && detectedMapping.lastName);
      const hasContactMapping = detectedMapping.email || detectedMapping.phone;

      if (hasNameMapping && hasContactMapping) {
        const normalizedData = applyMapping(jsonData, detectedMapping);
        setImportedData(normalizedData);
        const { clean, conflicts: foundConflicts } = findConflicts(normalizedData);
        setCleanData(clean);
        setConflicts(foundConflicts);
        setStep('review');
      } else {
        setStep('mapping');
      }
    };

    reader.readAsBinaryString(file);
  }, [existingLeads]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  const handleMappingChange = (field: keyof ColumnMapping, value: string) => {
    setColumnMapping(prev => ({ ...prev, [field]: value === '__none__' ? '' : value }));
  };

  const handleConfirmMapping = () => {
    const normalizedData = applyMapping(rawData, columnMapping);
    setImportedData(normalizedData);
    const { clean, conflicts: foundConflicts } = findConflicts(normalizedData);
    setCleanData(clean);
    setConflicts(foundConflicts);
    setStep('review');
  };

  const handleBackToMapping = () => {
    setStep('mapping');
  };

  const handleConflictAction = (index: number, action: 'skip' | 'overwrite') => {
    setConflicts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, action } : c))
    );
  };

  const handleSelectAllConflicts = (action: 'skip' | 'overwrite') => {
    setConflicts((prev) => prev.map((c) => ({ ...c, action })));
  };

  const handleImport = () => {
    onImport(cleanData, conflicts);
    handleClose();
  };

  const handleClose = () => {
    setStep('upload');
    setRawData([]);
    setColumns([]);
    setColumnMapping({
      fullName: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      source: '',
      notes: '',
    });
    setImportedData([]);
    setConflicts([]);
    setCleanData([]);
    setFileName('');
    onOpenChange(false);
  };

  const isMappingValid = () => {
    const hasName = columnMapping.fullName || (columnMapping.firstName && columnMapping.lastName);
    const hasContact = columnMapping.email || columnMapping.phone;
    return hasName && hasContact;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Import leadow z Excela
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div
            {...getRootProps()}
            className={`mt-4 p-12 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
            }`}
            data-testid="dropzone-excel"
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              {isDragActive ? 'Upusc plik tutaj' : 'Przeciagnij i upusc plik Excel'}
            </p>
            <p className="text-xs text-muted-foreground">
              lub kliknij, aby wybrac (.xlsx, .xls)
            </p>
          </div>
        )}

        {step === 'mapping' && (
          <div className="mt-4 space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Settings2 className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <span className="text-sm font-medium">Mapowanie kolumn</span>
                <p className="text-xs text-muted-foreground">
                  Przypisz kolumny z pliku do odpowiednich pol
                </p>
              </div>
              <Badge variant="secondary">{rawData.length} wierszy</Badge>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  <p className="font-medium">Wymagane pola:</p>
                  <p className="text-xs mt-1">
                    Imie i nazwisko (lub osobno imie + nazwisko) oraz email lub telefon
                  </p>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-4">
                {(Object.keys(FIELD_LABELS) as (keyof ColumnMapping)[]).map((field) => (
                  <div key={field} className="flex items-center gap-4">
                    <span className="text-sm font-medium w-40 shrink-0">
                      {FIELD_LABELS[field]}
                      {(field === 'email' || field === 'phone' || field === 'fullName') && (
                        <span className="text-destructive ml-1">*</span>
                      )}
                    </span>
                    <Select
                      value={columnMapping[field] || '__none__'}
                      onValueChange={(value) => handleMappingChange(field, value)}
                    >
                      <SelectTrigger className="flex-1" data-testid={`select-mapping-${field}`}>
                        <SelectValue placeholder="Wybierz kolumne..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">-- Nie mapuj --</SelectItem>
                        {columns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {rawData.length > 0 && (
              <div className="p-3 rounded-lg border bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground mb-2">Podglad pierwszego wiersza:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {columns.slice(0, 6).map((col) => (
                    <div key={col} className="truncate">
                      <span className="font-medium">{col}:</span>{' '}
                      <span className="text-muted-foreground">{String(rawData[0][col] || '-')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 'review' && (
          <div className="mt-4 space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium flex-1">{fileName}</span>
              <Badge variant="secondary">{importedData.length} wierszy</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-700 dark:text-green-300">Gotowe do importu</span>
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">{cleanData.length}</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-medium text-amber-700 dark:text-amber-300">Konflikty</span>
                </div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{conflicts.length}</p>
              </div>
            </div>

            {conflicts.length > 0 && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    Rozwiaz konflikty przed importem
                  </p>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleSelectAllConflicts('skip')}
                      data-testid="button-skip-all"
                    >
                      Pomin wszystkie
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleSelectAllConflicts('overwrite')}
                      data-testid="button-overwrite-all"
                    >
                      Nadpisz wszystkie
                    </Button>
                  </div>
                </div>

                <ScrollArea className="flex-1 border rounded-lg">
                  <div className="divide-y">
                    {conflicts.map((conflict, index) => (
                      <div key={index} className="p-4" data-testid={`conflict-item-${index}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">
                              {conflict.imported.firstName} {conflict.imported.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {conflict.imported.email} | {conflict.imported.phone}
                            </p>
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                              Pasuje do: {conflict.existing.firstName} {conflict.existing.lastName}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant={conflict.action === 'skip' ? 'secondary' : 'ghost'}
                              size="sm"
                              onClick={() => handleConflictAction(index, 'skip')}
                              data-testid={`button-skip-${index}`}
                            >
                              Pomin
                            </Button>
                            <Button
                              variant={conflict.action === 'overwrite' ? 'secondary' : 'ghost'}
                              size="sm"
                              onClick={() => handleConflictAction(index, 'overwrite')}
                              data-testid={`button-overwrite-${index}`}
                            >
                              Nadpisz
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </div>
        )}

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={handleClose} data-testid="button-cancel-import">
            Anuluj
          </Button>
          {step === 'mapping' && (
            <Button 
              onClick={handleConfirmMapping} 
              disabled={!isMappingValid()}
              data-testid="button-confirm-mapping"
            >
              Kontynuuj
            </Button>
          )}
          {step === 'review' && (
            <>
              <Button 
                variant="outline" 
                onClick={handleBackToMapping}
                data-testid="button-back-to-mapping"
              >
                Zmien mapowanie
              </Button>
              <Button onClick={handleImport} data-testid="button-confirm-import">
                Importuj {cleanData.length + conflicts.filter(c => c.action === 'overwrite').length} leadow
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
