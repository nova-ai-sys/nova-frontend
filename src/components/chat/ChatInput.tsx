import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, X, FileText, Square } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/lib/i18n';
import { useIsMobile } from '@/hooks/useIsMobile';
import { isSupported, readFile, type FileReadResult } from '@/lib/fileUtils';

interface ChatInputProps {
  onSend: (message: string, files?: FileReadResult[]) => void;
  isLoading: boolean;
  /** Cancel the in-flight generation. Omit to hide the stop button. */
  onStop?: () => void;
  externalFiles?: FileReadResult[];
  onExternalFilesConsumed?: () => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, onStop, externalFiles, onExternalFilesConsumed, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [files, setFiles] = useState<FileReadResult[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    if (!isLoading) textareaRef.current?.focus();
  }, [isLoading]);

  // Merge in externally dropped files
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (externalFiles && externalFiles.length > 0) {
      setFiles((prev) => {
        const existingNames = new Set(prev.map((f) => f.name));
        const newFiles = externalFiles.filter((f) => !existingNames.has(f.name));
        return [...prev, ...newFiles];
      });
      onExternalFilesConsumed?.();
    }
  }, [externalFiles, onExternalFilesConsumed]);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleFiles = async (fileList: FileList) => {
    const newFiles: FileReadResult[] = [];
    const rejected: string[] = [];

    for (const file of Array.from(fileList)) {
      if (!isSupported(file.name)) {
        rejected.push(file.name);
        continue;
      }
      try {
        const result = await readFile(file);
        newFiles.push(result);
      } catch {
        rejected.push(file.name);
      }
    }

    if (rejected.length > 0) {
      toast(
        rejected.length === 1
          ? t('chat.unsupportedFile', { name: rejected[0] })
          : t('chat.unsupportedFiles', { n: rejected.length }),
        'warning',
      );
    }

    if (newFiles.length) setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((!value.trim() && files.length === 0) || isLoading || disabled) return;
    onSend(value.trim(), files.length > 0 ? files : undefined);
    setValue('');
    setFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const hasContent = value.trim() || files.length > 0;
  const isMobile = useIsMobile();

  const composer = (
    <motion.form
      onSubmit={handleSubmit}
      // The phone composer floats over the conversation, so it needs an opaque
      // surface of its own to stay readable; the pill radius is what marks it
      // as a thumb target rather than a panel. On desktop it sits in its own
      // row and takes the same surface at the page's usual radius.
      className={`overflow-hidden border border-surface-700/50 bg-surface-900 transition-colors focus-within:border-primary-700/50 focus-within:glow-green ${
        isMobile ? 'rounded-[32px]' : 'rounded-xl'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Attached files */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            className="flex flex-wrap gap-2 px-4 pt-3"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {files.map((f) => (
              <motion.span
                key={f.name}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-950/40 px-2.5 py-1 text-xs font-medium text-primary-400 ring-1 ring-primary-800/50"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <FileText className="h-3 w-3" />
                {f.name}
                <button
                  type="button"
                  onClick={() => removeFile(f.name)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-primary-900/40 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row. On a phone it collapses to a single horizontal bar: one
          line high, centred, and with no placeholder — an empty composer under
          a conversation needs no caption explaining what it is, and the row is
          shorter without one. */}
      <div className={`flex gap-2 px-4 ${isMobile ? 'items-center py-2' : 'items-end py-3'}`}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          title={t('chat.attach')}
          className="flex h-9 w-9 shrink-0 max-md:mb-0 md:mb-1 cursor-pointer items-center justify-center rounded-lg text-surface-500 transition-colors hover:bg-surface-800 hover:text-primary-400 disabled:opacity-40"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder={isMobile ? undefined : t('chat.placeholder')}
          rows={isMobile ? 1 : 2}
          disabled={isLoading || disabled}
          className={`flex-1 resize-none bg-transparent text-sm leading-relaxed text-surface-100 placeholder:text-surface-600 focus:outline-none disabled:opacity-50 ${
            isMobile ? 'py-1.5' : 'py-2'
          }`}
        />

        {/* While generating, the send button becomes a stop button. */}
        {isLoading && onStop ? (
          <button
            type="button"
            onClick={onStop}
            title={t('chat.stop')}
            aria-label={t('chat.stop')}
            className="flex h-9 w-9 shrink-0 max-md:mb-0 md:mb-1 cursor-pointer items-center justify-center rounded-lg bg-surface-800 text-surface-200 ring-1 ring-surface-600/50 transition-colors hover:bg-red-950/50 hover:text-red-400 hover:ring-red-800/50"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={!hasContent || isLoading || disabled}
            className="shrink-0 rounded-lg max-md:mb-0 md:mb-1"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.form>
  );

  return composer;
}
