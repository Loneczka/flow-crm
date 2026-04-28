import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { LeadCard } from './LeadCard';
import { Badge } from '@/components/ui/badge';
import { type Lead, type LeadStatus, STATUS_COLORS } from '@/lib/types';

interface KanbanBoardProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
}

const COLUMNS: { status: LeadStatus; title: string }[] = [
  { status: 'Nowy', title: 'Nowy' },
  { status: 'W_toku', title: 'W toku' },
  { status: 'Wstrzymany', title: 'Wstrzymany' },
  { status: 'Wniosek', title: 'Wniosek' },
  { status: 'Sukces', title: 'Sukces' },
  { status: 'Porazka', title: 'Porazka' },
];

export function KanbanBoard({ leads, onLeadClick, onStatusChange }: KanbanBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDragStart = (result: { draggableId: string }) => {
    setDraggingId(result.draggableId);
  };

  const handleDragEnd = (result: DropResult) => {
    setDraggingId(null);
    
    if (!result.destination) return;
    
    const leadId = result.draggableId;
    const newStatus = result.destination.droppableId as LeadStatus;
    
    onStatusChange(leadId, newStatus);
  };

  const getColumnLeads = (status: LeadStatus) => 
    leads.filter((lead) => lead.status === status);

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-1 pb-4 min-w-max" data-testid="kanban-board">
          {COLUMNS.map((column) => {
            const columnLeads = getColumnLeads(column.status);
            const colors = STATUS_COLORS[column.status];
            
            return (
              <div 
                key={column.status} 
                className="w-[320px] shrink-0 flex flex-col"
                data-testid={`kanban-column-${column.status}`}
              >
                <div className="flex items-center gap-2 mb-3 px-1 sticky top-0 bg-background py-2 z-10">
                  <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                  <h3 className="font-semibold text-sm">{column.title}</h3>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {columnLeads.length}
                  </Badge>
                </div>
                
                <Droppable droppableId={column.status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 min-h-[400px] p-2 rounded-lg transition-colors ${
                        snapshot.isDraggingOver 
                          ? 'bg-primary/5 border-2 border-dashed border-primary/30' 
                          : 'bg-muted/30'
                      }`}
                    >
                      <div className="space-y-3">
                        {columnLeads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <LeadCard
                                  lead={lead}
                                  onClick={() => onLeadClick(lead)}
                                  isDragging={snapshot.isDragging}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
      </div>
    </DragDropContext>
  );
}
