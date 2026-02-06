import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import React from 'react';

// Mock useVoiceRecording so starting recording immediately yields a transcription
vi.mock('@/components/VoiceOperator/useVoiceRecording', () => {
  return {
    useVoiceRecording: (opts: any) => {
      return {
        isRecording: false,
        isProcessing: false,
        error: null,
        startRecording: () => {
          // Immediately deliver a transcription
          opts?.onTranscription?.('Say hello', 'en');
        },
        stopRecording: vi.fn(),
        cancelRecording: vi.fn(),
      };
    },
  };
});

// Mock iOS audio unlock player to auto-complete playback
vi.mock('@/components/VoiceOperator/utils/iosAudioUnlock', () => ({
  getIOSAudioPlayer: () => ({
    unlock: () => {},
    async play(_url: string, onEnded?: () => void) {
      onEnded && onEnded();
    },
    stop: () => {},
  }),
}));

// Mock AudioURLManager to avoid URL.createObjectURL
vi.mock('@/components/VoiceOperator/utils/audioProcessor', () => ({
  AudioURLManager: class {
    createURL(_blob: Blob) { return 'blob:mock'; }
    revokeURL(_url: string) {}
    revokeAll() {}
  },
  isValidAudioBlob: () => true,
}));

// Mock router
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import VoiceOperator from '@/components/VoiceOperator';

function sseResponse(parts: string[]) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // meta
      controller.enqueue(encoder.encode('event: meta\n'));
      controller.enqueue(encoder.encode('data: {"clientActions":[]}\n\n'));
      // deltas
      for (const p of parts) {
        controller.enqueue(encoder.encode('event: delta\n'));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: p })}\n\n`));
      }
      // done
      controller.enqueue(encoder.encode('event: done\n'));
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ success: true })}\n\n`));
      controller.close();
    },
  });
  return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

describe('VoiceOperator (UI streaming)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(global, 'fetch').mockImplementation(async (input: any) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (String(url).includes('/api/agent/chat/stream')) {
        return sseResponse(['Hello', ' ', 'world']);
      }
      if (String(url).includes('/api/agent/speak')) {
        return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'Content-Type': 'audio/mpeg' } });
      }
      return new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('streams assistant text and then triggers TTS', async () => {
    render(<VoiceOperator />);

    // Click FAB button
    const btn = document.querySelector('button');
    expect(btn).toBeTruthy();
    fireEvent.click(btn!);

    // StartRecording is called on a small timeout; advance timers
    vi.advanceTimersByTime(600);

    // Wait for streamed text to appear
    await waitFor(() => {
      expect(screen.getByText(/Assistant:/i)).toBeInTheDocument();
      expect(screen.getByText(/Hello world/i)).toBeInTheDocument();
    });

    // Ensure speak was called
    const fetchCalls = (global.fetch as any).mock.calls.map((c: any[]) => c[0].toString());
    expect(fetchCalls.some((u: string) => u.includes('/api/agent/speak'))).toBe(true);
  });
});

