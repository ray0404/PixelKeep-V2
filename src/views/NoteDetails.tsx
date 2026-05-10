import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNoteStore } from '../stores/useNoteStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTranscriptionStore } from '../stores/useTranscriptionStore';
import { PixelButton } from '../components/ui/PixelButton';
import { PixelCheckbox } from '../components/ui/PixelCheckbox';
import { PixelModal } from '../components/ui/PixelModal';
import { PixelProgressBar } from '../components/ui/PixelProgressBar';
import { PTASummary } from '../components/PTASummary';
import { Note } from '../db/db';
import { htmlToPlainText } from '../utils/ui';
import { parsePTA, PTAParseResult } from '../utils/ptaParser';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

type ContentSegment =
  | { type: 'html'; html: string }
  | { type: 'pta'; result: PTAParseResult };

const PTA_BLOCK_RE = /```(?:ledger|pta)\n([\s\S]*?)```/g;

function buildSegments(plainText: string, markdownMode: boolean): ContentSegment[] {
  if (!markdownMode) {
    return [{ type: 'html', html: plainText }];
  }

  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  PTA_BLOCK_RE.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = PTA_BLOCK_RE.exec(plainText)) !== null) {
    if (match.index > lastIndex) {
      const chunk = plainText.slice(lastIndex, match.index);
      const html = DOMPurify.sanitize(
        marked.parse(chunk, { breaks: true, gfm: true }) as string
      );
      segments.push({ type: 'html', html });
    }
    segments.push({ type: 'pta', result: parsePTA(match[1]) });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < plainText.length) {
    const chunk = plainText.slice(lastIndex);
    const html = DOMPurify.sanitize(
      marked.parse(chunk, { breaks: true, gfm: true }) as string
    );
    segments.push({ type: 'html', html });
  }

  return segments.length > 0
    ? segments
    : [{
        type: 'html',
        html: DOMPurify.sanitize(
          marked.parse(plainText, { breaks: true, gfm: true }) as string
        )
      }];
}

export const NoteDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notes, setSearchQuery, getAsset, updateNote } = useNoteStore();
  const settings = useSettingsStore();
  const { reset: resetTranscription, transcribe, lastResult, isTranscribing, activeNoteId, status, progress, step } = useTranscriptionStore();
  const [note, setNote] = useState<Note | null>(null);
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState<string | null>(null);
  const [resolvedAudioBlob, setResolvedAudioBlob] = useState<Blob | null>(null);

  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);

  useEffect(() => {
    const found = notes.find(n => n.id === Number(id));
    if (found) {
      setNote(found);
      if (found.audio) {
          if (found.audio.startsWith('asset:')) {
              getAsset(found.audio.replace('asset:', '')).then(blob => {
                  if (blob) {
                    setResolvedAudioUrl(URL.createObjectURL(blob));
                    setResolvedAudioBlob(blob);
                  }
              });
          } else {
              setResolvedAudioUrl(found.audio);
          }
      }
    }

    return () => {
        if (resolvedAudioUrl && resolvedAudioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(resolvedAudioUrl);
        }
    };
  }, [id, notes, getAsset]);

  useEffect(() => {
    if (lastResult && !isTranscribing && note && activeNoteId === note.id && step === 'complete') {
        const decipheredText = `\n\n--- DECIPHERED ECHO ---\n${lastResult}`;
        if (!note.content.includes('DECIPHERED ECHO')) {
            useNoteStore.getState().updateNote(note.id, {
                content: note.content + decipheredText
            });
            resetTranscription();
        }
    }
  }, [lastResult, isTranscribing, note, activeNoteId, step]);

  const segments = useMemo(() => {
    if (!note) return [];
    const plainText = note.isMarkdownMode
      ? htmlToPlainText(note.content)
      : note.content;
    return buildSegments(plainText, !!note.isMarkdownMode);
  }, [note?.content, note?.isMarkdownMode]);

  if (!note) return <div className="p-4 text-center">Note not found.</div>;

  const handleCopy = async () => {
    const content = htmlToPlainText(note.content);
    const plainText = settings.includeTitleInCopy ? `${note.title}\n\n${content}` : content;
    try {
      await navigator.clipboard.writeText(plainText);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
    navigate('/notes');
  };

  const handleToggleMarkdown = async (checked: boolean) => {
    if (note) {
      await updateNote(note.id, { isMarkdownMode: checked });
    }
  };

  const handleDecipherClick = () => {
    const hasPermission = localStorage.getItem('whisper_model_permission') === 'true';
    if (!hasPermission) {
      setIsPermissionModalOpen(true);
    } else {
      startDeciphering();
    }
  };

  const startDeciphering = () => {
    if (resolvedAudioBlob && note) {
        resetTranscription();
        transcribe(resolvedAudioBlob, note.id);
    }
  };

  const grantPermission = () => {
    localStorage.setItem('whisper_model_permission', 'true');
    setIsPermissionModalOpen(false);
    startDeciphering();
  };

  const isCurrentNoteTranscribing = isTranscribing && activeNoteId === note.id;

  return (
    <div className="p-4 space-y-6">
      <div>
        <p className="pb-4 pt-1 text-xs font-normal leading-normal text-text-meta">
          Last edited: {new Date(note.updatedAt).toLocaleString()}
        </p>
        <div className="flex items-center justify-between">
          <h2 className="mb-4 text-lg font-bold text-primary">{note.title}</h2>
          <div className="flex items-center gap-2">
             {settings.enableMarkdownFeature && (
               <div className="flex items-center gap-2 mr-2">
                 <span className="text-[10px] uppercase text-text-meta">MD</span>
                 <PixelCheckbox
                   checked={!!note.isMarkdownMode}
                   onChange={(e) => handleToggleMarkdown(e.target.checked)}
                 />
               </div>
             )}
             <PixelButton variant="surface" onClick={() => navigate(`/notes/edit/${note.id}`)}>
              <span className="material-symbols-outlined">edit</span>
            </PixelButton>
            <PixelButton variant="surface" onClick={handleCopy}>
              <span className="material-symbols-outlined">content_copy</span>
            </PixelButton>
          </div>
        </div>
      </div>

      {resolvedAudioUrl && (
        <div className="space-y-4">
          <div
            className="flex flex-col gap-2 border-2 border-border-light bg-surface p-2 shadow-pixel-btn"
            data-testid="note-audio-player"
          >
            <span className="text-[10px] text-text-meta uppercase">Echo Stone Recording</span>
            <audio src={resolvedAudioUrl} controls className="w-full h-10" />
          </div>

         {resolvedAudioBlob && !isCurrentNoteTranscribing && (
            <div className="relative group">
                <PixelButton
                    variant="primary"
                    className="w-full h-12 text-xs gap-2"
                    onClick={handleDecipherClick}
                    disabled={isTranscribing}
                >
                    <span className="material-symbols-outlined">auto_fix_high</span>
                    {isTranscribing ? 'ORACLE IS BUSY...' : 'DECIPHER ECHO'}
                </PixelButton>
            </div>
         )}

         {isCurrentNoteTranscribing && (
             <div className="space-y-2 p-2 border-2 border-primary bg-primary/5">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-primary">DECIPHERING ECHO...</span>
                    <span className="text-[10px] text-text-light/70 animate-pulse">Running in background</span>
                 </div>
                 <PixelProgressBar
                    progress={progress}
                    label={status}
                    color="secondary"
                 />
                 <p className="text-[9px] text-text-meta text-center">
                    You may leave this page. The ritual will continue.
                 </p>
             </div>
         )}
        </div>
      )}

      <div
        className={`note-content-display mb-6 text-xs font-normal break-words ${note.isMarkdownMode ? 'markdown-body' : 'whitespace-pre-wrap'}`}
        style={{ color: settings.terminalTextColor || settings.textColor }}
      >
        {segments.map((seg, i) =>
          seg.type === 'pta'
            ? <PTASummary key={i} result={seg.result} />
            : <div key={i} dangerouslySetInnerHTML={{ __html: seg.html }} />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {note.tags.map(tag => (
          <span
            key={tag}
            onClick={() => handleTagClick(tag)}
            className="border-2 border-border-light bg-surface px-3 py-1 text-[10px] font-medium text-primary shadow-pixel-btn cursor-pointer hover:bg-primary/10 transition-colors"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="pt-4">
        <PixelButton variant="secondary" className="h-14 w-full text-sm uppercase" onClick={() => navigate('/notes')}>
          Back to Scroll Case
        </PixelButton>
      </div>

      <PixelModal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        title="Invoke the Oracle"
      >
        <div className="space-y-4 text-center">
          <span className="material-symbols-outlined text-6xl text-secondary">
            history_edu
          </span>
          <p className="text-xs leading-snug">
            To decipher this Echo, we must invoke the AI Oracle. This requires a one-time download of approximately <span className="text-secondary font-bold">40MB</span>.
          </p>
          <p className="text-[10px] text-text-meta italic">
            The Oracle will reside locally in your browser, ensuring your voice never leaves this device.
          </p>
          <div className="pt-4 flex flex-col gap-3">
            <PixelButton onClick={grantPermission} className="w-full h-12 text-xs">
              I ACCEPT THE RITUAL
            </PixelButton>
            <PixelButton variant="secondary" onClick={() => setIsPermissionModalOpen(false)} className="w-full h-12 text-xs">
              NOT NOW
            </PixelButton>
          </div>
        </div>
      </PixelModal>
    </div>
  );
};
