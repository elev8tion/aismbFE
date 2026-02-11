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

  /**
   * Call this during a user interaction (tap/click) to unlock audio playback.
   * MUST always resume AudioContext even if already unlocked — iOS can
   * suspend it between gestures.
   */
  unlock(): void {
    // Always resume AudioContext during user gesture (iOS can suspend it anytime)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        void this.audioContext.resume();
      } catch (err) {
        console.warn('AudioContext resume during unlock failed (non-fatal):', err);
      }
    }

    if (this.isUnlocked && this.audio) {
      return;
    }

    // Create audio element during user interaction
    this.audio = new Audio();

    // iOS Safari needs these attributes
    this.audio.setAttribute('playsinline', 'true');
    this.audio.setAttribute('webkit-playsinline', 'true');

    // DO NOT call setupAudioContext() here — createMediaElementSource()
    // routes audio through a potentially-suspended AudioContext, causing
    // AbortError on iOS Safari. Defer to play() instead.

    // Play silent audio to unlock
    // Create a tiny silent audio data URL (smallest valid MP3)
    const silentAudioBase64 = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwmHAAAAAAD/+9DEAAAIAAJQAAAAgAADSAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';

    this.audio.src = silentAudioBase64;
    this.audio.volume = 0.01; // Nearly silent

    // Play to unlock
    const playPromise = this.audio.play();
    if (playPromise) {
      playPromise
        .then(() => {
          this.isUnlocked = true;
          // Immediately pause after unlocking
          this.audio?.pause();
          this.audio!.currentTime = 0;
          this.audio!.volume = 1; // Reset volume
        })
        .catch((err) => {
          console.warn('iOS audio unlock failed:', err);
        });
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

    // Set up Web Audio API gain boost (deferred from unlock to avoid AbortError)
    this.setupAudioContext();

    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (err) {
        console.warn('AudioContext resume failed during play (non-fatal):', err);
      }
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
