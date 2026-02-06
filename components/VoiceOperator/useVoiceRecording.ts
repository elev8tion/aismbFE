// Custom hook for voice recording with proper cleanup and error handling

import { useState, useRef, useCallback, useEffect } from 'react';
import { SafeMediaRecorder } from './utils/mediaRecorder';
import {
  NetworkError,
  ValidationError,
  UserCancelledError,
  checkBrowserCompatibility,
} from './utils/browserCompatibility';
import { AudioURLManager, isValidAudioBlob } from './utils/audioProcessor';

export interface VoiceRecordingOptions {
  onTranscription?: (text: string) => void;
  onError?: (error: Error) => void;
  maxDurationMs?: number;
}

export interface VoiceRecordingState {
  isRecording: boolean;
  error: Error | null;
  isProcessing: boolean;
}

export function useVoiceRecording(options: VoiceRecordingOptions = {}) {
  const { onTranscription, onError, maxDurationMs = 60000 } = options;

  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    error: null,
    isProcessing: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<SafeMediaRecorder | null>(null);
  const isRecordingRef = useRef(false);
  const audioURLManagerRef = useRef<AudioURLManager>(new AudioURLManager());

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.cancel();
      mediaRecorderRef.current = null;
    }
    audioURLManagerRef.current.revokeAll();
    isRecordingRef.current = false;
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const handleError = useCallback(
    (error: Error) => {
      setState((prev) => ({ ...prev, error, isRecording: false, isProcessing: false }));
      if (onError) onError(error);
      cleanup();
    },
    [onError, cleanup]
  );

  const sendToAPI = useCallback(
    async (audioBlob: Blob, mimeType: string): Promise<void> => {
      if (!isValidAudioBlob(audioBlob)) {
        throw new ValidationError('Invalid audio data');
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const formData = new FormData();
        const extension = mimeType.split('/')[1].split(';')[0];
        const file = new File([audioBlob], `recording.${extension}`, { type: mimeType });
        formData.append('audio', file);

        const response = await fetch('/api/agent/transcribe', {
          method: 'POST',
          body: formData,
          signal: abortController.signal,
          credentials: 'include',
        });

        if (!response.ok) {
          let errorDetail = '';
          try {
            const errorData = await response.json() as { error?: string; details?: string };
            errorDetail = errorData.details || errorData.error || response.statusText;
          } catch {
            errorDetail = response.statusText;
          }
          throw new NetworkError(`Transcribe failed (${response.status}): ${errorDetail}`);
        }

        const data = await response.json() as { text?: string };
        if (!data || typeof data.text !== 'string') {
          throw new ValidationError('Invalid API response format');
        }

        if (onTranscription) onTranscription(data.text);

        setState((prev) => ({ ...prev, isProcessing: false, error: null }));
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new UserCancelledError('Request cancelled by user');
        }
        if (error instanceof TypeError) {
          throw new NetworkError('Network request failed. Please check your connection.');
        }
        throw error;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [onTranscription]
  );

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) return;

    try {
      checkBrowserCompatibility();
      isRecordingRef.current = true;
      setState({ isRecording: true, error: null, isProcessing: false });

      const recorder = new SafeMediaRecorder({ maxDurationMs, onError: handleError });
      mediaRecorderRef.current = recorder;
      await recorder.start();

      timeoutRef.current = setTimeout(() => {
        stopRecording();
      }, maxDurationMs);
    } catch (error) {
      isRecordingRef.current = false;
      handleError(error instanceof Error ? error : new Error('Failed to start recording'));
    }
  }, [maxDurationMs, handleError]);

  const stopRecording = useCallback(async () => {
    if (!isRecordingRef.current || !mediaRecorderRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    try {
      setState((prev) => ({ ...prev, isRecording: false, isProcessing: true }));
      const { audioBlob, mimeType } = await mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      isRecordingRef.current = false;
      await sendToAPI(audioBlob, mimeType);
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Failed to stop recording'));
    }
  }, [sendToAPI, handleError]);

  const cancelRecording = useCallback(() => {
    if (isRecordingRef.current) {
      cleanup();
      setState({ isRecording: false, error: null, isProcessing: false });
    }
  }, [cleanup]);

  return { ...state, startRecording, stopRecording, cancelRecording };
}
