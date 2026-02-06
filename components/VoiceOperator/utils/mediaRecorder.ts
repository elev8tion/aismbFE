// Safe MediaRecorder wrapper with error handling and cleanup

import { getBrowserAudioFormat, PermissionDeniedError } from './browserCompatibility';

export interface RecordingResult {
  audioBlob: Blob;
  mimeType: string;
}

export interface MediaRecorderOptions {
  maxDurationMs?: number;
  onDataAvailable?: (chunk: Blob) => void;
  onError?: (error: Error) => void;
}

export class SafeMediaRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private mimeType: string;
  private onErrorCallback?: (error: Error) => void;

  constructor(options: MediaRecorderOptions = {}) {
    this.onErrorCallback = options.onError;
    const format = getBrowserAudioFormat();
    this.mimeType = format.mimeType;
  }

  async start(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: this.mimeType,
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        const error = new Error(`MediaRecorder error: ${event}`);
        this.handleError(error);
      };

      // Safari requires timeslice for Whisper API compatibility
      this.mediaRecorder.start(1000);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          throw new PermissionDeniedError('Microphone access denied by user');
        }
        throw error;
      }
      throw new Error('Unknown error starting recording');
    }
  }

  async stop(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'));
        return;
      }

      if (this.mediaRecorder.state === 'inactive') {
        reject(new Error('MediaRecorder is not recording'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        try {
          const audioBlob = new Blob(this.chunks, { type: this.mimeType });
          this.cleanup();
          resolve({ audioBlob, mimeType: this.mimeType });
        } catch (error) {
          this.cleanup();
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  getState(): RecordingState {
    if (!this.mediaRecorder) return 'inactive';
    return this.mediaRecorder.state;
  }

  private cleanup(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.chunks = [];
    this.mediaRecorder = null;
  }

  private handleError(error: Error): void {
    this.cleanup();
    if (this.onErrorCallback) this.onErrorCallback(error);
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }
}

export type RecordingState = 'inactive' | 'recording' | 'paused';
