import React, { useState } from 'react';
import { Task } from '../db/db';
import { PixelButton } from './ui/PixelButton';
import { PixelCheckbox } from './ui/PixelCheckbox';
import { cn } from '../utils/ui';

interface TaskItemProps {
  task: Task;
  nodeId: string;
  onToggle: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number, nodeId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = React.memo(({ task, nodeId, onToggle, onEdit, onDelete }) => {

  const [showNotes, setShowNotes] = useState(false);

  const timeStr = task.time ? new Date(task.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';

  const dateStr = task.time ? new Date(task.time).toLocaleDateString() : ''; 



  return (

    <div className={cn(

      "flex flex-col gap-2 border-2 border-border-light bg-surface p-3 shadow-pixel-container transition-opacity",

      task.completed && "opacity-50"

    )}>

      <div className="flex items-start justify-between w-full">

        <div className="flex pt-1">

          <PixelCheckbox 

            checked={task.completed} 

            onChange={() => onToggle(task.id)}

          />

        </div>

        <div className="flex flex-1 flex-col justify-center gap-1 min-w-0 px-3">

          <p className={cn(

            "text-xs font-bold leading-normal",

            task.completed ? "text-text-light/70 line-through" : "text-primary"

          )}>

            {task.title}

          </p>

                    <div className="mt-1 space-y-1 text-[10px] text-text-meta">

                      {task.completionType === 'any_time' && (

                        <div className="flex items-center gap-2 text-secondary font-bold">

                          <span className="material-symbols-outlined text-base">all_inclusive</span>

                          <p>ANY TIME</p>

                        </div>

                      )}

                      {dateStr && (

              <div className="flex items-center gap-2">

                <span className="material-symbols-outlined text-base">event</span>

                <p>{dateStr}</p>

              </div>

            )}

            {timeStr && (

              <div className="flex items-center gap-2">

                <span className="material-symbols-outlined text-base">schedule</span>

                <p>{timeStr}</p>

              </div>

            )}

            {task.location && (

              <div className="flex items-center gap-2">

                <span className="material-symbols-outlined text-base">location_on</span>

                <p>{task.location}</p>

              </div>

            )}

            {task.people && (

              <div className="flex items-center gap-2">

                <span className="material-symbols-outlined text-base">group</span>

                <p>{task.people}</p>

              </div>

            )}

          </div>

        </div>

        <div className="task-card-actions flex items-center gap-2">
          {task.notes && (
            <PixelButton variant="ghost" className="ac-task-action-btn" onClick={() => setShowNotes(!showNotes)}>
              <span className="material-symbols-outlined text-lg">{showNotes ? 'expand_less' : 'expand_more'}</span>
            </PixelButton>
          )}
          <PixelButton variant="ghost" className="ac-task-action-btn" onClick={() => onEdit(task.id)}>
            <span className="material-symbols-outlined text-lg">edit</span>
          </PixelButton>
          <PixelButton variant="ghost" className="ac-task-action-btn ac-danger" onClick={() => onDelete(task.id, nodeId)}>
            <span className="material-symbols-outlined text-lg">delete</span>
          </PixelButton>
        </div>

      </div>

      

      {showNotes && task.notes && (

        <div className="mt-2 pt-2 border-t-2 border-dashed border-border-light text-[10px] text-text-light/80 italic whitespace-pre-wrap">

          {task.notes}

        </div>

      )}

    </div>

  );

}, (prevProps, nextProps) => {

  return (

    prevProps.task.id === nextProps.task.id &&

    prevProps.task.completed === nextProps.task.completed &&

    prevProps.task.title === nextProps.task.title &&

    prevProps.task.time === nextProps.task.time &&

    prevProps.task.location === nextProps.task.location &&

    prevProps.task.people === nextProps.task.people &&

    prevProps.task.notes === nextProps.task.notes &&

    prevProps.nodeId === nextProps.nodeId

  );

});
