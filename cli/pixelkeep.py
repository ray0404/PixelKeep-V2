#!/usr/bin/env python3
import json
import argparse
import os
import sys
import base64
import hashlib
from Crypto.Cipher import AES
from datetime import datetime

class CryptoJSAlgorithm:
    """
    Python implementation of CryptoJS AES decryption logic.
    CryptoJS uses OpenSSL-style EVP_BytesToKey for key derivation by default.
    """
    @staticmethod
    def derive_key_and_iv(password, salt, key_len, iv_len):
        d = d_i = b""
        while len(d) < key_len + iv_len:
            d_i = hashlib.md5(d_i + password + salt).digest()
            d += d_i
        return d[:key_len], d[key_len:key_len + iv_len]

    @classmethod
    def decrypt(cls, encrypted_str, password):
        try:
            data = base64.b64decode(encrypted_str)
            if data[:8] == b"Salted__":
                salt = data[8:16]
                ciphertext = data[16:]
            else:
                return None  # Or handle non-salted if necessary

            key, iv = cls.derive_key_and_iv(password.encode(), salt, 32, 16)
            cipher = AES.new(key, AES.MODE_CBC, iv)
            
            # Unpad
            decrypted = cipher.decrypt(ciphertext)
            padding_len = decrypted[-1]
            return decrypted[:-padding_len].decode('utf-8')
        except Exception as e:
            return None

class PixelKeepBridge:
    def __init__(self, backup_path, password=None):
        self.backup_path = backup_path
        self.password = password
        self.data = None
        self.load_data()

    def load_data(self):
        with open(self.backup_path, 'r') as f:
            self.data = json.load(f)
        
        # Check if the top-level arrays contain encrypted strings or objects
        # In current PixelKeep PWA, exportData decrypts them.
        # But we'll add support for decrypting individual fields if they are strings.
        self.process_encryption()

    def process_encryption(self):
        if not self.password:
            return

        for category in ['notes', 'tasks', 'nodes', 'folders']:
            if category in self.data:
                items = self.data[category]
                for i, item in enumerate(items):
                    # If the item itself is a string, it's a raw encrypted blob from the DB
                    if isinstance(item, str):
                        decrypted = CryptoJSAlgorithm.decrypt(item, self.password)
                        if decrypted:
                            self.data[category][i] = json.loads(decrypted)
                    # If it's a dict but has a 'data' field that is a string, it's also encrypted
                    elif isinstance(item, dict) and isinstance(item.get('data'), str):
                        decrypted = CryptoJSAlgorithm.decrypt(item['data'], self.password)
                        if decrypted:
                            # Merge decrypted data into the item
                            dec_obj = json.loads(decrypted)
                            self.data[category][i] = {**item, **dec_obj}
                            del self.data[category][i]['data']

    def build_tree(self):
        nodes = self.data.get('nodes', [])
        # Also include folders if they aren't in nodes (legacy)
        folders = self.data.get('folders', [])
        
        # Index all items by their ID
        tree = {}
        items_by_id = {}
        
        # Build map of nodes
        for node in nodes:
            items_by_id[node['id']] = {
                'id': node['id'],
                'name': node['name'],
                'type': node['type'],
                'parentId': node['parentId'],
                'children': [],
                'itemRefId': node.get('itemRefId')
            }

        # Root containers
        roots = {
            'root_notes': {'id': 'root_notes', 'name': 'Notes', 'type': 'root', 'children': []},
            'root_tasks': {'id': 'root_tasks', 'name': 'Quests', 'type': 'root', 'children': []}
        }

        # Place nodes in hierarchy
        final_roots = []
        node_objects = list(items_by_id.values())
        
        for node in node_objects:
            p_id = node['parentId']
            if p_id in items_by_id:
                items_by_id[p_id]['children'].append(node)
            elif p_id in roots:
                roots[p_id]['children'].append(node)
            else:
                # Orphan or real root
                final_roots.append(node)

        return list(roots.values()) + final_roots

    def print_tree(self, nodes, indent=""):
        for i, node in enumerate(nodes):
            is_last = i == len(nodes) - 1
            marker = "└── " if is_last else "├── "
            
            # Mask sensitive titles if no password (though here we assume we decrypted)
            print(f"{indent}{marker}{node['name']} ({node['type']})")
            
            new_indent = indent + ("    " if is_last else "│   ")
            if node['children']:
                self.print_tree(node['children'], new_indent)

    def export_markdown(self, output_dir):
        os.makedirs(output_dir, exist_ok=True)
        notes = {n['id']: n for n in self.data.get('notes', [])}
        nodes = self.data.get('nodes', [])
        
        for node in nodes:
            if node['type'] == 'note':
                note_id = node.get('itemRefId')
                if note_id in notes:
                    note = notes[note_id]
                    # Create safe filename
                    safe_name = "".join([c if c.isalnum() else "_" for c in node['name']])
                    file_path = os.path.join(output_dir, f"{safe_name}.md")
                    
                    with open(file_path, 'w') as f:
                        f.write(f"# {note['title']}\n\n")
                        f.write(f"{note['content']}\n\n")
                        if note.get('tags'):
                            f.write(f"Tags: {', '.join(note['tags'])}\n")
                        f.write(f"\n---\nExported from PixelKeep at {datetime.now().isoformat()}\n")
        
        print(f"Exported {len(notes)} notes to {output_dir}")

    def to_jref(self):
        """
        Converts the PixelKeep structure to a jref-compatible snapshot.
        """
        files = {}
        notes = {n['id']: n for n in self.data.get('notes', [])}
        nodes = self.data.get('nodes', [])
        
        # Build path map
        def get_path(node_id, current_path=""):
            node = next((n for n in nodes if n['id'] == node_id), None)
            if not node: return current_path
            
            name = "".join([c if c.isalnum() or c in '._-' else "_" for c in node['name']])
            new_path = os.path.join(name, current_path) if current_path else name
            
            if node['parentId'] == 'root_notes' or node['parentId'] == 'root_tasks':
                prefix = "notes" if node['parentId'] == 'root_notes' else "tasks"
                return os.path.join(prefix, new_path)
            
            return get_path(node['parentId'], new_path)

        for node in nodes:
            if node['type'] == 'note':
                note_id = node.get('itemRefId')
                if note_id in notes:
                    note = notes[note_id]
                    path = get_path(node['id'])
                    if not path.endswith('.md'): path += '.md'
                    
                    content = f"# {note['title']}\n\n{note['content']}"
                    if note.get('tags'):
                        content += f"\n\nTags: {', '.join(note['tags'])}"
                    files[path] = content
            elif node['type'] == 'task':
                # Similar logic for tasks
                pass

        snapshot = {
            "directoryStructure": self.generate_dir_structure(list(files.keys())),
            "files": files,
            "instruction": "This is a snapshot of my PixelKeep notes and tasks.",
            "fileSummary": "PixelKeep Backup Export"
        }
        return snapshot

    def generate_dir_structure(self, paths):
        if not paths: return "."
        root = {}
        for path in paths:
            parts = path.split(os.sep)
            curr = root
            for p in parts:
                if p not in curr: curr[p] = {}
                curr = curr[p]
        
        lines = ["."]
        def render(node, indent=""):
            keys = sorted(node.keys())
            for i, k in enumerate(keys):
                is_last = i == len(keys) - 1
                marker = "└── " if is_last else "├── "
                lines.append(f"{indent}{marker}{k}")
                if node[k]:
                    render(node[k], indent + ("    " if is_last else "│   "))
        render(root)
        return "\n".join(lines)

def main():
    parser = argparse.ArgumentParser(description="PixelKeep JSON Snapshot CLI Bridge")
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Inspect
    inspect_parser = subparsers.add_parser("inspect", help="Inspect backup file metadata")
    inspect_parser.add_argument("file", help="Path to backup.json")

    # Tree
    tree_parser = subparsers.add_parser("tree", help="Visualize folder hierarchy")
    tree_parser.add_argument("file", help="Path to backup.json")
    tree_parser.add_argument("-p", "--password", help="Password for decryption")

    # Export
    export_parser = subparsers.add_parser("export", help="Export notes to Markdown files")
    export_parser.add_argument("file", help="Path to backup.json")
    export_parser.add_argument("-o", "--output", default="export", help="Output directory")
    export_parser.add_argument("-p", "--password", help="Password for decryption")

    # JREF
    jref_parser = subparsers.add_parser("to-jref", help="Convert to jref snapshot format")
    jref_parser.add_argument("file", help="Path to backup.json")
    jref_parser.add_argument("-p", "--password", help="Password for decryption")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    password = getattr(args, 'password', None)
    bridge = PixelKeepBridge(args.file, password)

    if args.command == "inspect":
        print(f"Backup Version: {bridge.data.get('version')}")
        print(f"Exported At: {bridge.data.get('exportedAt')}")
        print(f"Notes: {len(bridge.data.get('notes', []))}")
        print(f"Tasks: {len(bridge.data.get('tasks', []))}")
        print(f"Folders/Nodes: {len(bridge.data.get('nodes', []))}")

    elif args.command == "tree":
        tree = bridge.build_tree()
        bridge.print_tree(tree)

    elif args.command == "export":
        bridge.export_markdown(args.output)

    elif args.command == "to-jref":
        snapshot = bridge.to_jref()
        print(json.dumps(snapshot, indent=2))

if __name__ == "__main__":
    main()
