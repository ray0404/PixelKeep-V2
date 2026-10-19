import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoteDetails } from './NoteDetails';
import { useNoteStore } from '../stores/useNoteStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTranscriptionStore } from '../stores/useTranscriptionStore';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock stores
vi.mock('../stores/useNoteStore', () => ({
  useNoteStore: vi.fn()
}));

vi.mock('../stores/useSettingsStore', () => ({
  useSettingsStore: vi.fn()
}));

vi.mock('../stores/useTranscriptionStore', () => ({
    useTranscriptionStore: vi.fn()
}));

const mockNote = {
  id: 1,
  title: 'Test Note',
  content: 'Test content',
  tags: ['test'],
  audio: 'blob:http://localhost:3000/123',
  updatedAt: new Date().toISOString()
};

describe('NoteDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useNoteStore as any).mockReturnValue({
      notes: [mockNote],
      setSearchQuery: vi.fn(),
      getAsset: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'audio/mpeg' }))
    });
    (useSettingsStore as any).mockReturnValue({
      includeTitleInCopy: true,
      textColor: '#ffffff'
    });
    (useTranscriptionStore as any).mockReturnValue({
        setDownloading: vi.fn(),
        reset: vi.fn()
    });
    
    // Set a resolvedAudioBlob by making the note audio an asset path
    mockNote.audio = 'asset:test-audio';

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      clear: vi.fn()
    };
    vi.stubGlobal('localStorage', localStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders audio player if audio exists', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/1']}>
        <Routes>
          <Route path="/notes/:id" element={<NoteDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('note-audio-player')).toBeInTheDocument();
  });

  it('renders "DECIPHER ECHO" button if audio exists', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/1']}>
        <Routes>
          <Route path="/notes/:id" element={<NoteDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/DECIPHER ECHO/i)).toBeInTheDocument();
  });

  it('shows permission modal on first decipher click', async () => {
    render(
      <MemoryRouter initialEntries={['/notes/1']}>
        <Routes>
          <Route path="/notes/:id" element={<NoteDetails />} />
        </Routes>
      </MemoryRouter>
    );

    const button = await screen.findByText(/DECIPHER ECHO/i);
    fireEvent.click(button);

    expect(await screen.findByText(/Invoke the Oracle/i)).toBeInTheDocument();
  });

  it('shows progress bar when transcribing this note', async () => {
    (useTranscriptionStore as any).mockReturnValue({
        isTranscribing: true,
        activeNoteId: 1,
        progress: 50,
        status: 'Reading...',
        reset: vi.fn(),
        transcribe: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/notes/1']}>
        <Routes>
          <Route path="/notes/:id" element={<NoteDetails />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/DECIPHERING ECHO/i)).toBeInTheDocument();
    expect(await screen.findByText(/Reading.../i)).toBeInTheDocument();
  });

  it('copies note contents without extra newlines between lines', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: { writeText: writeTextMock }
    });
    vi.stubGlobal('alert', vi.fn());

    (useNoteStore as any).mockReturnValue({
      notes: [{
        id: 1,
        title: 'Multi Line Note',
        content: '<div>Line 1</div><div>Line 2</div><div>Line 3</div>',
        tags: [],
        updatedAt: new Date().toISOString()
      }],
      setSearchQuery: vi.fn(),
      getAsset: vi.fn()
    });

    render(
      <MemoryRouter initialEntries={['/notes/1']}>
        <Routes>
          <Route path="/notes/:id" element={<NoteDetails />} />
        </Routes>
      </MemoryRouter>
    );

    const copyBtn = screen.getByText('content_copy').closest('button')!;
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith('Multi Line Note\n\nLine 1\nLine 2\nLine 3');
  });

  it('handles codeblock copy button click', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: { writeText: writeTextMock }
    });

    (useNoteStore as any).mockReturnValue({
      notes: [{
        id: 1,
        title: 'Code Note',
        content: '```js\nconsole.log("hello");\n```',
        isMarkdownMode: true,
        tags: [],
        updatedAt: new Date().toISOString()
      }],
      setSearchQuery: vi.fn(),
      getAsset: vi.fn()
    });

    render(
      <MemoryRouter initialEntries={['/notes/1']}>
        <Routes>
          <Route path="/notes/:id" element={<NoteDetails />} />
        </Routes>
      </MemoryRouter>
    );

    const codeCopyBtn = await screen.findByTitle('Copy code');
    fireEvent.click(codeCopyBtn);

    expect(writeTextMock).toHaveBeenCalledWith('console.log("hello");');
  });

  it('smoothly scrolls to heading when TOC link is clicked', async () => {
    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    (useNoteStore as any).mockReturnValue({
      notes: [{
        id: 1,
        title: 'TOC Note',
        content: '# Table of Contents\n\n[Section One](#section-one)\n\n## Section One',
        isMarkdownMode: true,
        tags: [],
        updatedAt: new Date().toISOString()
      }],
      setSearchQuery: vi.fn(),
      getAsset: vi.fn()
    });

    render(
      <MemoryRouter initialEntries={['/notes/1']}>
        <Routes>
          <Route path="/notes/:id" element={<NoteDetails />} />
        </Routes>
      </MemoryRouter>
    );

    const link = await screen.findByRole('link', { name: 'Section One' });
    fireEvent.click(link);

    expect(scrollIntoViewMock).toHaveBeenCalled();
  });
});
