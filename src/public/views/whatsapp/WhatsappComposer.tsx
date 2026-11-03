import React, { useEffect, useRef, useState } from 'react';
import { Paperclip, Send, X, FileText } from 'lucide-react';

interface WhatsappComposerProps {
  chatJid: string;
  sending: boolean;
  onSendText: (text: string) => Promise<void>;
  onSendMedia: (file: File, caption?: string) => Promise<void>;
}

export const WhatsappComposer: React.FC<WhatsappComposerProps> = ({
  chatJid, sending, onSendText, onSendMedia,
}) => {
  const [draft, setDraft] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraft('');
    setAttachedFile(null);
  }, [chatJid]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (sending) return;
    if (attachedFile) {
      const fileToSend = attachedFile;
      const caption = draft.trim();
      setAttachedFile(null);
      setDraft('');
      await onSendMedia(fileToSend, caption || undefined);
      return;
    }
    if (!draft.trim()) return;
    const text = draft;
    setDraft('');
    await onSendText(text);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      e.preventDefault();
      setAttachedFile(files[0]);
    }
  };

  return (
    <>
      {attachedFile && (
        <div className="wa-attachment-bar">
          <FileText size={18} color="#00a884" />
          <span className="wa-attachment-name">
            {attachedFile.name} ({(attachedFile.size / 1024).toFixed(1)} KB)
          </span>
          <button type="button" className="wa-icon-btn" onClick={() => setAttachedFile(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <form className="wa-composer" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files?.[0]) setAttachedFile(e.target.files[0]);
            e.target.value = '';
          }}
        />
        <button type="button" className="wa-icon-btn" onClick={() => fileInputRef.current?.click()} title="Adjuntar imagen o PDF">
          <Paperclip size={20} />
        </button>
        <textarea
          rows={1}
          className="wa-composer-input"
          placeholder={attachedFile ? 'Añadí un comentario opcional...' : 'Escribí un mensaje o pegá con Ctrl+V...'}
          value={draft}
          onPaste={handlePaste}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSubmit(); }
          }}
        />
        <button type="submit" className="wa-send-btn" disabled={sending || (!draft.trim() && !attachedFile)} title="Enviar">
          <Send size={18} />
        </button>
      </form>
    </>
  );
};

