import { useState, useCallback, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, View } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { type Lead, STATUS_COLORS } from '@/lib/types';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(BigCalendar);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Lead;
}

interface CalendarViewProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onDateChange: (lead: Lead, newDate: Date) => void;
}

export function CalendarView({ leads, onLeadClick, onDateChange }: CalendarViewProps) {
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date());

  const events: CalendarEvent[] = useMemo(() => 
    leads
      .filter((lead) => lead.contactDate)
      .map((lead) => ({
        id: lead.id,
        title: `${lead.firstName} ${lead.lastName}`,
        start: new Date(lead.contactDate!),
        end: new Date(new Date(lead.contactDate!).getTime() + 30 * 60000),
        resource: lead,
      })),
    [leads]
  );

  const handleEventDrop = useCallback(
    (args: any) => {
      const lead = args.event.resource as Lead;
      onDateChange(lead, new Date(args.start));
    },
    [onDateChange]
  );

  const handleSelectEvent = useCallback(
    (event: any) => {
      onLeadClick(event.resource as Lead);
    },
    [onLeadClick]
  );

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const eventStyleGetter = () => {
    return {
      style: {
        backgroundColor: 'hsl(var(--primary))',
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        fontSize: '12px',
        padding: '2px 6px',
      },
    };
  };

  return (
    <div className="h-full flex flex-col" data-testid="calendar-view">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newDate = new Date(date);
              if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
              else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
              else newDate.setDate(newDate.getDate() - 1);
              handleNavigate(newDate);
            }}
            data-testid="button-calendar-prev"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newDate = new Date(date);
              if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
              else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
              else newDate.setDate(newDate.getDate() + 1);
              handleNavigate(newDate);
            }}
            data-testid="button-calendar-next"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => handleNavigate(new Date())}
            data-testid="button-calendar-today"
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            Today
          </Button>
          <h2 className="font-semibold text-lg ml-2">
            {format(date, view === 'month' ? 'MMMM yyyy' : 'MMMM d, yyyy')}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={view === 'month' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewChange('month')}
            data-testid="button-view-month"
          >
            Month
          </Button>
          <Button
            variant={view === 'week' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewChange('week')}
            data-testid="button-view-week"
          >
            Week
          </Button>
          <Button
            variant={view === 'day' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewChange('day')}
            data-testid="button-view-day"
          >
            Day
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-background rounded-lg border overflow-hidden calendar-container">
        <style>{`
          .calendar-container .rbc-calendar {
            font-family: var(--font-sans);
          }
          .calendar-container .rbc-header {
            padding: 8px;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            background: hsl(var(--muted));
            border-bottom: 1px solid hsl(var(--border));
          }
          .calendar-container .rbc-today {
            background: hsl(var(--primary) / 0.05);
          }
          .calendar-container .rbc-off-range-bg {
            background: hsl(var(--muted) / 0.3);
          }
          .calendar-container .rbc-event {
            background: hsl(var(--primary));
          }
          .calendar-container .rbc-event:focus {
            outline: 2px solid hsl(var(--ring));
            outline-offset: 2px;
          }
          .calendar-container .rbc-day-slot .rbc-time-slot {
            border-top: 1px solid hsl(var(--border) / 0.5);
          }
          .calendar-container .rbc-timeslot-group {
            border-bottom: 1px solid hsl(var(--border));
          }
          .calendar-container .rbc-time-view,
          .calendar-container .rbc-month-view {
            border: none;
          }
          .calendar-container .rbc-time-header {
            border-bottom: 1px solid hsl(var(--border));
          }
          .calendar-container .rbc-time-content {
            border-top: none;
          }
          .calendar-container .rbc-current-time-indicator {
            background-color: hsl(var(--destructive));
          }
          .calendar-container .rbc-addons-dnd .rbc-addons-dnd-resize-ns-icon,
          .calendar-container .rbc-addons-dnd .rbc-addons-dnd-resize-ew-icon {
            display: none;
          }
        `}</style>
        <DnDCalendar
          localizer={localizer}
          events={events}
          view={view}
          date={date}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          onEventDrop={handleEventDrop}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          toolbar={false}
          resizable={false}
          selectable
          step={30}
          timeslots={2}
          min={new Date(0, 0, 0, 7, 0, 0)}
          max={new Date(0, 0, 0, 20, 0, 0)}
          style={{ height: '100%' }}
        />
      </div>
    </div>
  );
}
