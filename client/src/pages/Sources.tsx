import { useState } from 'react';
import { useSources, useCreateSource, useDeleteSource } from '@/hooks/useSources';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tag, Plus, Trash2, Loader2 } from 'lucide-react';

export default function Sources() {
  const [newSourceName, setNewSourceName] = useState('');
  const { data: sources = [], isLoading } = useSources();
  const createSource = useCreateSource();
  const deleteSource = useDeleteSource();
  const { toast } = useToast();

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim()) return;

    try {
      await createSource.mutateAsync(newSourceName.trim());
      setNewSourceName('');
      toast({
        title: 'Sukces',
        description: 'Zrodlo zostalo dodane',
      });
    } catch (error: any) {
      const message = error?.message || 'Blad podczas dodawania zrodla';
      toast({
        title: 'Blad',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSource = async (id: string, name: string) => {
    try {
      await deleteSource.mutateAsync(id);
      toast({
        title: 'Sukces',
        description: `Zrodlo "${name}" zostalo usuniete`,
      });
    } catch (error) {
      toast({
        title: 'Blad',
        description: 'Blad podczas usuwania zrodla',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-8 space-y-6" data-testid="sources-page">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Zrodla leadow</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Zarzadzaj zrodlami z ktorych pochodza leady
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Plus className="w-5 h-5 text-muted-foreground" />
            Dodaj nowe zrodlo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddSource} className="flex gap-3">
            <Input
              placeholder="Nazwa zrodla (np. Facebook, Google Ads)"
              value={newSourceName}
              onChange={(e) => setNewSourceName(e.target.value)}
              className="flex-1"
              data-testid="input-source-name"
            />
            <Button
              type="submit"
              disabled={createSource.isPending || !newSourceName.trim()}
              data-testid="button-add-source"
            >
              {createSource.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span className="ml-2">Dodaj</span>
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Tag className="w-5 h-5 text-muted-foreground" />
            Lista zrodel ({sources.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : sources.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Brak zrodel. Dodaj pierwsze zrodlo powyzej.</p>
            </div>
          ) : (
            <div className="divide-y">
              {sources.map((source) => (
                <div
                  key={source.id}
                  className="flex items-center justify-between gap-4 py-3"
                  data-testid={`source-row-${source.id}`}
                >
                  <div className="flex items-center gap-3">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium" data-testid={`text-source-name-${source.id}`}>
                      {source.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSource(source.id, source.name)}
                    disabled={deleteSource.isPending}
                    data-testid={`button-delete-source-${source.id}`}
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
