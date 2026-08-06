import React, { useEffect, useState, useRef } from 'react';
import { useUIStore } from '../stores/useUIStore';
import { useFolderStore } from '../stores/useFolderStore';
import { cn } from '../utils/ui';
import { useNavigate, useLocation } from 'react-router-dom';
import { PixelButton } from './ui/PixelButton';
import { PixelModal } from './ui/PixelModal';
import { PixelInput } from './ui/PixelInput';
import { PixelCheckbox } from './ui/PixelCheckbox';
import { useSettingsStore } from '../stores/useSettingsStore';
import { SortableFolderItem } from './SortableFolderItem';

// DnD Kit
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FSNode } from '../db/db';

export const Sidebar: React.FC = () => {
  const { sidebarOpen, setSidebarOpen, movingItems, setMovingItems } = useUIStore();
  const { nodes, fetchNodes, addFolder, currentFolderId, setCurrentFolderId, deleteNode, moveNodes, renameNode, reorderNodes } = useFolderStore();
  const { dualDirectory } = useSettingsStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, id: string | null, name: string }>({ isOpen: false, id: null, name: '' });

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [newNodeName, setNewName] = useState('');
  const [nodeToRename, setNodeToRename] = useState<string | null>(null);

  const [activeDragItem, setActiveDragItem] = useState<FSNode | null>(null);
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<Set<string>>(new Set());

  const toggleFolderCollapse = (folderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCollapsedFolderIds(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 10,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (sidebarOpen) {
      fetchNodes();
    }
  }, [sidebarOpen, fetchNodes]);

  const isTasksView = location.pathname.includes('tasks');
  const rootId = isTasksView ? 'root_tasks' : 'root_notes';

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await addFolder(newFolderName, currentFolderId, isTasksView ? 'task' : 'note');
    setNewFolderName('');
    setIsNewFolderModalOpen(false);
  };

  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleStart = (id: string, e?: React.TouchEvent | React.MouseEvent) => {
    if (e && 'touches' in e && e.touches.length > 0) {
      startPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e && 'clientX' in e) {
      startPosRef.current = { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
    }
    timerRef.current = setTimeout(() => {
      setSelectionMode(true);
      if (!selectedIds.includes(id)) setSelectedIds(prev => [...prev, id]);
      timerRef.current = null;
    }, 200);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (timerRef.current && startPosRef.current && e.touches.length > 0) {
      const deltaX = Math.abs(e.touches[0].clientX - startPosRef.current.x);
      const deltaY = Math.abs(e.touches[0].clientY - startPosRef.current.y);
      if (deltaX > 8 || deltaY > 8) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPosRef.current = null;
  };

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      const newIds = selectedIds.filter(i => i !== id);
      setSelectedIds(newIds);
      if (newIds.length === 0) setSelectionMode(false);
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleRenameInit = () => {
    if (selectedIds.length !== 1) return;
    const nodeId = selectedIds[0];
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setNodeToRename(nodeId);
      setNewName(node.name);
      setIsRenameModalOpen(true);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nodeToRename && newNodeName.trim()) {
      await renameNode(nodeToRename, newNodeName);
      setIsRenameModalOpen(false);
      setSelectionMode(false);
      setSelectedIds([]);
    }
  };

  const handleMoveInit = () => {
      setMovingItems({
          ids: selectedIds,
          type: 'folder', 
          source: 'sidebar'
      });
      setSelectionMode(false);
      setSelectedIds([]);
      setSidebarOpen(false); 
  };

  const handlePlaceItems = async () => {
      if (!movingItems) return;
      await moveNodes(movingItems.ids as string[], currentFolderId);
      setMovingItems(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const node = nodes.find((n) => n.id === event.active.id);
    if (node) setActiveDragItem(node);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (active.id !== over?.id && over) {
      const activeNode = nodes.find((n) => n.id === active.id);
      const overNode = nodes.find((n) => n.id === over.id);
      if (!activeNode || !overNode) return;

      const isPartOfSelection = selectedIds.includes(active.id as string);
      const movingIds = isPartOfSelection ? selectedIds : [active.id as string];
      
      // If dropped ON a folder, move INSIDE
      if (overNode.type === 'folder' && !movingIds.includes(overNode.id)) {
          await moveNodes(movingIds, overNode.id);
          if (isPartOfSelection) {
              setSelectionMode(false);
              setSelectedIds([]);
          }
          return;
      }

      // Otherwise, handle reordering (same level)
      const destinationParentId = overNode.parentId;
      const siblings = nodes.filter(n => n.parentId === destinationParentId);
      siblings.sort((a, b) => (a.order || 0) - (b.order || 0));

      const oldIndex = siblings.findIndex(n => movingIds.includes(n.id));
      const targetIndex = siblings.findIndex(n => n.id === over.id);

      const remainingSiblings = siblings.filter(n => !movingIds.includes(n.id));
      const overIndex = remainingSiblings.findIndex(n => n.id === over.id);
      
      let insertionIndex = 0;
      if (overIndex === -1) {
        insertionIndex = 0;
      } else if (oldIndex !== -1 && oldIndex < targetIndex) {
        // Moving DOWN: insert AFTER overNode in remainingSiblings
        insertionIndex = overIndex + 1;
      } else {
        // Moving UP: insert BEFORE overNode in remainingSiblings
        insertionIndex = overIndex;
      }

      const newOrderList = [...remainingSiblings];
      const nodesToMove = nodes.filter(n => movingIds.includes(n.id));
      
      newOrderList.splice(insertionIndex, 0, ...nodesToMove);
      
      const updates = newOrderList.map((node, index) => ({
          ...node,
          parentId: destinationParentId,
          order: index
      }));
      
      // @ts-ignore
      await reorderNodes(updates);
      
      if (isPartOfSelection) {
          setSelectionMode(false);
          setSelectedIds([]);
      }
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirm.id) {
      await deleteNode(deleteConfirm.id);
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
    }
  };

  const renderScaffolding = (parentId: string, depth: number = 0) => {
    let children = nodes.filter(n => n.parentId === parentId);
    
    if (!dualDirectory) {
      if (isTasksView || parentId === 'root_tasks') {
        children = children.filter(n => n.type === 'task' || n.type === 'folder');
      } else {
        children = children.filter(n => n.type === 'note' || n.type === 'folder');
      }
    }
    
    return (
      <SortableContext 
        items={children.map(n => n.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={cn("space-y-1", depth > 0 && "ml-4 border-l-2 border-border-light/20 pl-2")}>
          {children.map(node => {
            const isCollapsed = collapsedFolderIds.has(node.id);
            const childNodes = nodes.filter(n => n.parentId === node.id);
            const hasChildren = childNodes.length > 0;

            return (
              <SortableFolderItem key={node.id} id={node.id}>
                <div 
                  className={cn(
                    "group flex items-center justify-between p-1 hover:bg-primary/10 cursor-pointer rounded select-none",
                    currentFolderId === node.id && "bg-primary/20",
                    selectedIds.includes(node.id) && "bg-secondary/20 border border-secondary/50"
                  )}
                  onTouchStart={(e) => handleStart(node.id, e)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleEnd}
                  onTouchCancel={handleEnd}
                  onMouseDown={(e) => handleStart(node.id, e)}
                  onMouseUp={handleEnd}
                  onMouseLeave={handleEnd}
                  onClick={(e) => {
                    if (selectionMode) {
                      e.stopPropagation();
                      handleToggle(node.id);
                    } else {
                      if (node.type === 'folder') {
                        setCurrentFolderId(node.id);
                        navigate(isTasksView ? '/tasks' : '/notes');
                      } else if (node.type === 'note') {
                        navigate(`/notes/view/${node.itemRefId}`);
                        setSidebarOpen(false);
                      } else if (node.type === 'task') {
                        navigate(`/tasks/edit/${node.itemRefId}`);
                        setSidebarOpen(false);
                      }
                    }
                  }}
                >
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {selectionMode && (
                       <div className="pointer-events-none">
                         <PixelCheckbox checked={selectedIds.includes(node.id)} onChange={() => {}} />
                       </div>
                    )}
                    {node.type === 'folder' && (
                      <button
                        type="button"
                        onClick={(e) => toggleFolderCollapse(node.id, e)}
                        className="p-0.5 text-text-light/70 hover:text-primary transition-colors flex items-center justify-center rounded hover:bg-primary/20"
                        title={isCollapsed ? "Expand directory" : "Collapse directory"}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {isCollapsed ? 'chevron_right' : 'expand_more'}
                        </span>
                      </button>
                    )}
                    <span className="material-symbols-outlined text-sm text-secondary">
                      {node.type === 'folder' ? (isCollapsed ? 'folder' : 'folder_open') : node.type === 'note' ? 'description' : 'task_alt'}
                    </span>
                    <span className="text-[10px] font-bold truncate">{node.name}</span>
                    {node.type === 'folder' && hasChildren && (
                      <span className="text-[8px] text-text-light/50 font-normal ml-0.5">
                        ({childNodes.length})
                      </span>
                    )}
                  </div>
                  {!selectionMode && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ isOpen: true, id: node.id, name: node.name });
                      }}
                      className="opacity-0 group-hover:opacity-100 text-danger hover:text-primary transition-opacity"
                    >
                      <span className="material-symbols-outlined text-xs">delete</span>
                    </button>
                  )}
                </div>
                {node.type === 'folder' && !isCollapsed && renderScaffolding(node.id, depth + 1)}
              </SortableFolderItem>
            );
          })}
        </div>
      </SortableContext>
    );
  };

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />
      
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform border-r-4 border-border-dark bg-surface transition-transform duration-300 ease-in-out shadow-pixel-container flex flex-col",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b-4 border-border-dark p-4 bg-surface">
          <h2 className="text-xs font-bold uppercase text-primary text-shadow-pixel">Directories</h2>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="text-secondary hover:text-primary"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-4 flex gap-2 border-b-2 border-border-light/30">
          <PixelButton 
            variant="secondary" 
            className="flex-1 h-10 text-[10px]"
            onClick={() => {
              setCurrentFolderId(isTasksView ? 'root_tasks' : 'root_notes');
              navigate(isTasksView ? '/tasks' : '/notes');
            }}
          >
            ROOT
          </PixelButton>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            autoScroll={{
              threshold: { x: 0, y: 0.15 },
              acceleration: 10,
            }}
          >
            {dualDirectory ? (
              <>
                <div>
                  <h3 className="text-[10px] font-bold text-secondary uppercase mb-2 border-b border-border-light/20">Notes</h3>
                  {renderScaffolding('root_notes')}
                </div>
                <div>
                  <h3 className="text-[10px] font-bold text-secondary uppercase mb-2 border-b border-border-light/20">Tasks</h3>
                  {renderScaffolding('root_tasks')}
                </div>
              </>
            ) : (
              renderScaffolding(rootId)
            )}
            <DragOverlay>
              {activeDragItem ? (
                <div className="flex items-center gap-2 p-2 bg-surface border-2 border-primary rounded shadow-pixel-container opacity-90 scale-105 relative">
                  {selectedIds.length > 1 && selectedIds.includes(activeDragItem.id) && (
                    <div className="absolute -top-3 -right-3 size-6 bg-secondary border-2 border-border-dark flex items-center justify-center text-[10px] font-bold text-text-light shadow-pixel-btn z-30">
                      {selectedIds.length}
                    </div>
                  )}
                  <span className="material-symbols-outlined text-sm text-primary">
                    {activeDragItem.type === 'folder' ? 'folder' : activeDragItem.type === 'note' ? 'description' : 'task_alt'}
                  </span>
                  <span className="text-[10px] font-bold truncate text-primary">{activeDragItem.name}</span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        <div className="p-4 border-t-4 border-border-dark bg-surface">
           {selectionMode ? (
              <div className="flex gap-2">
                 <PixelButton className="w-full h-12 text-xs uppercase" variant="secondary" onClick={() => { setSelectionMode(false); setSelectedIds([]); }}>
                    Cancel ({selectedIds.length})
                 </PixelButton>
                 {selectedIds.length === 1 && (
                    <PixelButton className="w-full h-12 text-xs uppercase" onClick={handleRenameInit}>
                        RENAME
                    </PixelButton>
                 )}
                 <PixelButton className="w-full h-12 text-xs uppercase" onClick={handleMoveInit}>
                    MOVE
                 </PixelButton>
              </div>
           ) : (
             !movingItems && (
              <PixelButton 
                className="w-full h-12 text-xs uppercase gap-2"
                onClick={() => setIsNewFolderModalOpen(true)}
              >
                <span className="material-symbols-outlined text-base">create_new_folder</span>
                New Folder
              </PixelButton>
             )
           )}
           {movingItems && movingItems.source === 'sidebar' && (
              <div className="flex gap-2">
                   <PixelButton onClick={() => setMovingItems(null)} variant="secondary" className="flex-1">CANCEL</PixelButton>
                   <PixelButton onClick={handlePlaceItems} className="flex-1">PLACE HERE</PixelButton>
              </div>
           )}
        </div>
      </aside>

      <PixelModal 
        isOpen={isNewFolderModalOpen} 
        onClose={() => setIsNewFolderModalOpen(false)}
        title="New Folder"
      >
        <form onSubmit={handleCreateFolder} className="space-y-4">
          <PixelInput 
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name..."
            autoFocus
          />
          <PixelButton type="submit" className="w-full h-12 text-xs">CREATE</PixelButton>
        </form>
      </PixelModal>

      <PixelModal 
        isOpen={isRenameModalOpen} 
        onClose={() => setIsRenameModalOpen(false)}
        title="Rename Node"
      >
        <form onSubmit={handleRenameSubmit} className="space-y-4">
          <PixelInput 
            value={newNodeName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New name..."
            autoFocus
          />
          <PixelButton type="submit" className="w-full h-12 text-xs">RENAME</PixelButton>
        </form>
      </PixelModal>

      <PixelModal 
        isOpen={deleteConfirm.isOpen} 
        onClose={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
        title="Confirm Delete"
      >
        <p className="mb-4 text-xs text-text-light">Delete "{deleteConfirm.name}"?</p>
        <div className="flex justify-end gap-2">
           <PixelButton variant="secondary" onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })}>CANCEL</PixelButton>
           <PixelButton className="bg-danger" onClick={confirmDelete}>DELETE</PixelButton>
        </div>
      </PixelModal>
    </>
  );
};
