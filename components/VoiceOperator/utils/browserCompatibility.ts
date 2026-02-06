// Browser compatibility utilities for voice recording

export class BrowserNotSupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BrowserNotSupportedError';
  }
}

export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionDeniedError';
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UserCancelledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserCancelledError';
  }
}

export interface AudioFormat {
  mimeType: string;
  fileExtension: string;
}

export function getBrowserAudioFormat(): AudioFormat {
  if (!window.MediaRecorder) {
    throw new BrowserNotSupportedError('MediaRecorder API not available in this browser');
  }

  const formats: AudioFormat[] = [
    { mimeType: 'audio/webm;codecs=opus', fileExtension: 'webm' },
    { mimeType: 'audio/webm', fileExtension: 'webm' },
    { mimeType: 'audio/mp4', fileExtension: 'm4a' },
    { mimeType: 'audio/ogg;codecs=opus', fileExtension: 'ogg' },
  ];

  for (const format of formats) {
    if (MediaRecorder.isTypeSupported(format.mimeType)) {
      return format;
    }
  }

  throw new BrowserNotSupportedError('No supported audio formats found');
}

export function isGetUserMediaSupported(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

export function isSecureContext(): boolean {
  return window.isSecureContext;
}

export function checkBrowserCompatibility(): void {
  if (!isSecureContext()) {
    throw new BrowserNotSupportedError(
      'Voice recording requires HTTPS. Please access this page over a secure connection.'
    );
  }

  if (!isGetUserMediaSupported()) {
    throw new BrowserNotSupportedError(
      'Your browser does not support microphone access. Please use a modern browser like Chrome, Firefox, or Safari.'
    );
  }

  getBrowserAudioFormat();
}

export function getErrorMessage(error: Error): string {
  if (error instanceof BrowserNotSupportedError) return error.message;
  if (error instanceof PermissionDeniedError) return 'Microphone access denied. Please enable microphone permissions in your browser settings.';
  if (error instanceof NetworkError) return 'Network error. Please check your connection and try again.';
  if (error instanceof ValidationError) return 'Invalid response from server. Please try again.';
  if (error instanceof UserCancelledError) return '';
  return 'An unexpected error occurred. Please try again.';
}
