// iOS Safari Audio Unlock Utility

export class IOSAudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private isUnlocked = false;
  private isAudioContextConnected = false;
  private onEndedCallback: (() => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private readonly VOLUME_BOOST = 2.5;

  unlock(): void {
    if (this.isUnlocked && this.audio) return;

    this.audio = new Audio();
    this.audio.setAttribute('playsinline', 'true');
    this.audio.setAttribute('webkit-playsinline', 'true');

    this.setupAudioContext();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try { void this.audioContext.resume(); } catch { /* non-fatal */ }
    }

    const silentAudioBase64 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+9DEAAAIAAJQAAAAgAADSAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';

    this.audio.src = silentAudioBase64;
    this.audio.volume = 0.01;

    const playPromise = this.audio.play();
    if (playPromise) {
      playPromise
        .then(() => {
          this.isUnlocked = true;
          this.audio?.pause();
          this.audio!.currentTime = 0;
          this.audio!.volume = 1;
        })
        .catch(() => { /* iOS unlock failed - non-fatal */ });
    }
  }

  private setupAudioContext(): void {
    if (this.isAudioContextConnected || !this.audio) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioContext = new AudioContextClass();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.gain.value = this.VOLUME_BOOST;
      this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
      this.sourceNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);
      this.isAudioContextConnected = true;
    } catch { /* non-fatal */ }
  }

  async play(
    blobUrl: string,
    onEnded?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    this.onEndedCallback = onEnded || null;
    this.onErrorCallback = onError || null;

    if (!this.audio) {
      this.audio = new Audio();
      this.audio.setAttribute('playsinline', 'true');
      this.audio.setAttribute('webkit-playsinline', 'true');
    }

    this.setupAudioContext();

    if (this.audioContext && this.audioContext.state === 'suspended') {
      try { await this.audioContext.resume(); } catch { /* non-fatal */ }
    }

    this.audio.onended = () => { if (this.onEndedCallback) this.onEndedCallback(); };
    this.audio.onerror = () => { if (this.onErrorCallback) this.onErrorCallback(new Error('Audio playback failed')); };

    this.audio.src = blobUrl;
    this.audio.currentTime = 0;
    this.audio.volume = 1.0;

    try {
      await this.audio.play();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (this.onErrorCallback) this.onErrorCallback(err);
      throw err;
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  dispose(): void {
    if (this.audio) { this.audio.pause(); this.audio.src = ''; this.audio = null; }
    if (this.audioContext) { this.audioContext.close(); this.audioContext = null; }
    this.sourceNode = null;
    this.gainNode = null;
    this.isUnlocked = false;
    this.isAudioContextConnected = false;
    this.onEndedCallback = null;
    this.onErrorCallback = null;
  }
}

let iosAudioPlayerInstance: IOSAudioPlayer | null = null;

export function getIOSAudioPlayer(): IOSAudioPlayer {
  if (!iosAudioPlayerInstance) {
    iosAudioPlayerInstance = new IOSAudioPlayer();
  }
  return iosAudioPlayerInstance;
}
