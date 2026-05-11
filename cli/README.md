# PixelKeep CLI Bridge

This directory contains a Python-based utility to interact with PixelKeep PWA backups (`pixel-keep-backup.json`).

## Setup

1.  Ensure you have Python 3.10+ installed.
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Usage

### Inspect Backup
View metadata about the backup file.
```bash
python pixelkeep.py inspect backup.json
```

### Visualize Tree
Print the hierarchical folder structure.
```bash
python pixelkeep.py tree backup.json -p <your_password>
```

### Export Notes
Decrypt and export all notes as Markdown files.
```bash
python pixelkeep.py export backup.json -p <your_password> -o ./my_notes
```

### Convert to jref Snapshot
Generate a snapshot compatible with the `jref` CLI and MCP server.
```bash
python pixelkeep.py to-jref backup.json -p <your_password> > snapshot.json
```

## Security Note
This tool uses `pycryptodome` to decrypt data locally. Your password is only used in-memory for the duration of the command and is never stored.
