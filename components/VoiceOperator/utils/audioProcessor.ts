// Audio processing and lifecycle management utilities

export class AudioURLManager {
  private urls: Set<string> = new Set();

  createURL(blob: Blob): string {
    const url = URL.createObjectURL(blob);
    this.urls.add(url);
    return url;
  }

  revokeURL(url: string): void {
    if (this.urls.has(url)) {
      URL.revokeObjectURL(url);
      this.urls.delete(url);
    }
  }

  revokeAll(): void {
    this.urls.forEach((url) => URL.revokeObjectURL(url));
    this.urls.clear();
  }
}

export function isValidAudioBlob(blob: Blob): boolean {
  if (!blob || blob.size === 0) return false;
  return blob.type.startsWith('audio/');
}
