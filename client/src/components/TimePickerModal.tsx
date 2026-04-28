import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface TimePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  leadName: string;
  onConfirm: (dateWithTime: Date) => void;
}

export function TimePickerModal({ 
  open, 
  onOpenChange, 
  date, 
  leadName, 
  onConfirm 
}: TimePickerModalProps) {
  const [hours, setHours] = useState(9);
  const [minutes, setMinutes] = useState(0);

  const incrementHours = () => setHours((h) => (h + 1) % 24);
  const decrementHours = () => setHours((h) => (h - 1 + 24) % 24);
  const incrementMinutes = () => setMinutes((m) => (m + 15) % 60);
  const decrementMinutes = () => setMinutes((m) => (m - 15 + 60) % 60);

  const handleConfirm = () => {
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    onConfirm(newDate);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Set Contact Time
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="p-4 rounded-lg bg-muted text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
              <Calendar className="w-4 h-4" />
              <span>Scheduling contact for</span>
            </div>
            <p className="font-semibold text-lg">{leadName}</p>
            <p className="text-sm font-mono mt-1">{format(date, 'EEEE, MMMM d, yyyy')}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-center block">Select Time</Label>
            <div className="flex items-center justify-center gap-4">
              <div className="flex flex-col items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={incrementHours}
                  data-testid="button-increment-hours"
                >
                  <ChevronUp className="w-5 h-5" />
                </Button>
                <Input
                  type="text"
                  value={hours.toString().padStart(2, '0')}
                  readOnly
                  className="w-16 text-center font-mono text-2xl font-bold h-14"
                  data-testid="input-hours"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={decrementHours}
                  data-testid="button-decrement-hours"
                >
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </div>
              <span className="text-3xl font-bold">:</span>
              <div className="flex flex-col items-center">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={incrementMinutes}
                  data-testid="button-increment-minutes"
                >
                  <ChevronUp className="w-5 h-5" />
                </Button>
                <Input
                  type="text"
                  value={minutes.toString().padStart(2, '0')}
                  readOnly
                  className="w-16 text-center font-mono text-2xl font-bold h-14"
                  data-testid="input-minutes"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={decrementMinutes}
                  data-testid="button-decrement-minutes"
                >
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} data-testid="button-cancel-time">
            Cancel
          </Button>
          <Button onClick={handleConfirm} data-testid="button-confirm-time">
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
