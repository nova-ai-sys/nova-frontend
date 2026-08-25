import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ICON_OPTIONS } from '@/lib/folderIcons';
import type { ChatFolder } from '@/components/layout/Sidebar';

/* ── Modal ─────────────────────────────────────────────────── */

interface FolderModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; icon: string }) => void;
  initial?: ChatFolder | null;
}

export function FolderModal({ open, onClose, onSave, initial }: FolderModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? 'folder');

  // Reset state when modal opens with different initial data
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(initial?.name ?? '');
      setIcon(initial?.icon ?? 'folder');
    }
  }, [open, initial]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ name: trimmed, icon });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit folder' : 'New folder'}>
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-400">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            placeholder="Folder name..."
            className="w-full rounded-lg border border-surface-700/50 bg-surface-800 px-3 py-2 text-sm text-surface-200 outline-none placeholder:text-surface-600 focus:ring-1 focus:ring-primary-600/50"
            autoFocus
          />
        </div>

        {/* Icon picker */}
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-400">Icon</label>
          <div className="grid grid-cols-8 gap-1.5">
            {ICON_OPTIONS.map(({ name: iconName, Icon }) => (
              <button
                key={iconName}
                onClick={() => setIcon(iconName)}
                className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-all ${
                  icon === iconName
                    ? 'bg-primary-950/50 text-primary-400 ring-1 ring-primary-600/50'
                    : 'text-surface-400 hover:bg-surface-800 hover:text-surface-200'
                }`}
                title={iconName}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={!name.trim()}>
            {initial ? 'Save' : 'Create'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
