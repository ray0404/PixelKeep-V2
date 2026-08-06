import { create } from 'zustand';
import { db, FSNode } from '../db/db';
import { encrypt, decrypt } from '../utils/encryption';
import { useAuthStore } from './useAuthStore';
import { useSettingsStore } from './useSettingsStore';
import DecryptionWorker from '../workers/decryption.worker.ts?worker';

interface FolderState {
  nodes: FSNode[];
  loading: boolean;
  currentFolderId: string;
  setCurrentFolderId: (id: string) => void;
  fetchNodes: () => Promise<void>;
  addFolder: (name: string, parentId: string, type: 'note' | 'task') => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  moveNode: (id: string, newParentId: string) => Promise<void>;
  moveNodes: (ids: string[], newParentId: string) => Promise<void>;
  reorderNodes: (nodes: FSNode[]) => Promise<void>;
  renameNode: (id: string, newName: string) => Promise<void>;
}

let worker: Worker | null = null;

export const useFolderStore = create<FolderState>((set, get) => ({
  nodes: [],
  loading: false,
  currentFolderId: 'root_notes',

  setCurrentFolderId: (id) => set({ currentFolderId: id }),

  fetchNodes: async () => {
    const { password } = useAuthStore.getState();
    const { disableTaskEncryption } = useSettingsStore.getState();
    if (!password) return;

    set({ loading: true });
    
    const encryptedNodes = await db.fs_nodes.toArray();

    if (disableTaskEncryption) {
      const nodes: FSNode[] = [];
      const nodesToDecrypt: any[] = [];

      encryptedNodes.forEach(n => {
        try {
          const parsed = JSON.parse(n.data);
          nodes.push(parsed);
        } catch (e) {
          nodesToDecrypt.push(n);
        }
      });

      if (nodesToDecrypt.length === 0) {
        nodes.sort((a, b) => (a.order || 0) - (b.order || 0));
        set({ nodes, loading: false });
        return;
      }

      if (!worker) worker = new DecryptionWorker();
      worker.onmessage = (event) => {
        const { data } = event.data;
        const allNodes = [...nodes, ...data as FSNode[]];
        allNodes.sort((a, b) => (a.order || 0) - (b.order || 0));
        set({ nodes: allNodes, loading: false });
      };
      worker.postMessage({ items: nodesToDecrypt, password, type: 'NODES' });
      return;
    }

    if (!worker) {
      worker = new DecryptionWorker();
    }
    
    worker.onmessage = (event) => {
      const { data, error } = event.data;
      if (error) {
        console.error("Worker decryption error:", error);
        set({ loading: false });
        return;
      }
      
      const nodes = data as FSNode[];
      nodes.sort((a, b) => (a.order || 0) - (b.order || 0));
      set({ nodes, loading: false });
    };

    worker.postMessage({
      items: encryptedNodes,
      password,
      type: 'NODES'
    });
  },

  addFolder: async (name, parentId, _type) => {
    const { password } = useAuthStore.getState();
    if (!password) return;

    const id = `folder-${Date.now()}`;
    const newNode: FSNode = {
      id,
      parentId,
      type: 'folder',
      name,
      order: Date.now(),
      itemRefId: 0
    };

    const encryptedData = encrypt(newNode, password);
    await db.fs_nodes.put({ id, data: encryptedData });
    await get().fetchNodes();
  },

  deleteNode: async (id) => {
    const { nodes } = get();
    const nodeToDelete = nodes.find(n => n.id === id);
    if (!nodeToDelete) return;

    // Recursive deletion logic
    const deleteRecursive = async (nodeId: string) => {
      const children = nodes.filter(n => n.parentId === nodeId);
      for (const child of children) {
        await deleteRecursive(child.id);
      }
      
      const node = nodes.find(n => n.id === nodeId);
      if (node && node.type !== 'folder') {
        if (node.type === 'note') await db.notes.delete(node.itemRefId);
        if (node.type === 'task') await db.tasks.delete(node.itemRefId);
      }
      await db.fs_nodes.delete(nodeId);
    };

    await deleteRecursive(id);
    await get().fetchNodes();
  },

  moveNode: async (id, newParentId) => {
    const { password } = useAuthStore.getState();
    const { disableTaskEncryption } = useSettingsStore.getState();
    if (!password) return;

    const encryptedNode = await db.fs_nodes.get(id);
    if (encryptedNode) {
      let node: FSNode;
      try {
        node = disableTaskEncryption ? JSON.parse(encryptedNode.data) : decrypt(encryptedNode.data, password);
      } catch (e) {
        node = decrypt(encryptedNode.data, password);
      }
      
      if (node) {
        node.parentId = newParentId;
        const dataToStore = (disableTaskEncryption && (node.type === 'task')) ? JSON.stringify(node) : encrypt(node, password);
        await db.fs_nodes.put({ id, data: dataToStore });
        await get().fetchNodes();
      }
    }
  },

  moveNodes: async (ids, newParentId) => {
    const { password } = useAuthStore.getState();
    if (!password) return;

    for (const id of ids) {
        const encryptedNode = await db.fs_nodes.get(id);
        if (encryptedNode) {
            const node = decrypt(encryptedNode.data, password) as FSNode;
            node.parentId = newParentId;
            node.order = Date.now(); 
            const encryptedUpdatedNode = encrypt(node, password);
            await db.fs_nodes.put({ id, data: encryptedUpdatedNode });
        }
    }
    await get().fetchNodes();
  },

  reorderNodes: async (reorderedNodes) => {
    const { password } = useAuthStore.getState();
    const { disableTaskEncryption } = useSettingsStore.getState();
    if (!password) return;

    // Optimistically update local Zustand store state immediately
    const currentNodes = get().nodes;
    const reorderedMap = new Map(reorderedNodes.map((n, i) => [n.id, { ...n, order: i }]));
    const updatedNodes = currentNodes.map(node => reorderedMap.get(node.id) || node);
    updatedNodes.sort((a, b) => (a.order || 0) - (b.order || 0));
    set({ nodes: updatedNodes });

    for (let i = 0; i < reorderedNodes.length; i++) {
        const node = { ...reorderedNodes[i], order: i };
        const dataToStore = (disableTaskEncryption && (node.type === 'task')) ? JSON.stringify(node) : encrypt(node, password);
        await db.fs_nodes.put({ id: node.id, data: dataToStore });
    }
  },

  renameNode: async (id, newName) => {
    const { password } = useAuthStore.getState();
    const { disableTaskEncryption } = useSettingsStore.getState();
    if (!password) return;

    const encryptedNode = await db.fs_nodes.get(id);
    if (encryptedNode) {
      let node: FSNode;
      try {
        node = disableTaskEncryption ? JSON.parse(encryptedNode.data) : decrypt(encryptedNode.data, password);
      } catch (e) {
        node = decrypt(encryptedNode.data, password);
      }
      
      if (node) {
        node.name = newName;
        const dataToStore = (disableTaskEncryption && (node.type === 'task')) ? JSON.stringify(node) : encrypt(node, password);
        await db.fs_nodes.put({ id, data: dataToStore });
        await get().fetchNodes();
      }
    }
  }
}));