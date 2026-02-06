'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiquidMorphLogo from '../LiquidMorphLogo';
import { useVoiceRecording } from './useVoiceRecording';
import {
  checkBrowserCompatibility,
  getErrorMessage,
  BrowserNotSupportedError,
} from './utils/browserCompatibility';
import { AudioURLManager } from './utils/audioProcessor';
import { getIOSAudioPlayer } from './utils/iosAudioUnlock';
import { useRouter } from 'next/navigation';
import { useVoiceAgentActions } from '@/contexts/VoiceAgentActionsContext';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export default function VoiceOperator() {
  const router = useRouter();
  const { emit } = useVoiceAgentActions();
  const [isOpen, setIsOpen] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [displayError, setDisplayError] = useState<string | null>(null);
  const [browserSupported, setBrowserSupported] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showAutoClosePrompt, setShowAutoClosePrompt] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());

  const audioURLManagerRef = useRef<AudioURLManager>(new AudioURLManager());
  const abortControllerRef = useRef<AbortController | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const iosAudioPlayerRef = useRef(getIOSAudioPlayer());
  const detectedLanguageRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    try {
      checkBrowserCompatibility();
      setBrowserSupported(true);
    } catch (error) {
      setBrowserSupported(false);
      if (error instanceof BrowserNotSupportedError) {
        setDisplayError(error.message);
      } else {
        setDisplayError('Voice not supported in this browser');
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      audioURLManagerRef.current.revokeAll();
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      iosAudioPlayerRef.current.stop();
    };
  }, []);

  const startAutoCloseCountdown = useCallback(() => {
    setCountdown(30);
    setShowAutoClosePrompt(true);

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          countdownTimerRef.current = null;
          setIsOpen(false);
          setVoiceState('idle');
          setTranscript('');
          setDisplayError(null);
          setShowAutoClosePrompt(false);
          setCountdown(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const clearAutoCloseCountdown = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
    setShowAutoClosePrompt(false);
  }, []);

  const processVoiceInteraction = useCallback(async (transcribedText: string) => {
    setTranscript(transcribedText);
    setVoiceState('processing');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const language = detectedLanguageRef.current;

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question: transcribedText, sessionId, pagePath: window.location?.pathname || '/', language }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(`Failed to get response: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json() as { response: string; clientActions?: Array<{ type: string; route?: string; target?: string; scope?: string; action?: string; payload?: any }> };

      // Perform client actions. If a navigate action exists, run it first and
      // schedule remaining UI actions after navigation.
      if (Array.isArray(data.clientActions) && data.clientActions.length > 0) {
        const actions = data.clientActions;
        const navigateAction = actions.find(a => a && a.type === 'navigate' && typeof a.route === 'string');
        const otherActions = actions.filter(a => a !== navigateAction);

        if (navigateAction && navigateAction.route) {
          try { router.push(navigateAction.route); } catch { /* non-fatal */ }
          // Defer other UI actions slightly so destination screens can mount
          if (otherActions.length > 0) {
            setTimeout(() => {
              for (const a of otherActions) { try { emit(a as any); } catch { /* ignore */ } }
            }, 350);
          }
        } else {
          for (const a of actions) { try { emit(a as any); } catch { /* ignore */ } }
        }
      }

      setVoiceState('speaking');

      const speechResponse = await fetch('/api/agent/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: data.response, language }),
        signal: abortController.signal,
      });

      if (!speechResponse.ok) {
        throw new Error('Failed to generate speech');
      }

      const audioBlob = await speechResponse.blob();
      const audioUrl = audioURLManagerRef.current.createURL(audioBlob);

      await iosAudioPlayerRef.current.play(
        audioUrl,
        () => {
          setVoiceState('idle');
          audioURLManagerRef.current.revokeURL(audioUrl);
          startAutoCloseCountdown();
        },
        (error) => {
          console.error('Audio playback error:', error);
          setDisplayError(`Audio error: ${error.message}`);
          setVoiceState('idle');
          audioURLManagerRef.current.revokeURL(audioUrl);
        }
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setVoiceState('idle');
        return;
      }
      console.error('Voice interaction error:', error);
      setDisplayError(error instanceof Error ? error.message : String(error));
      setVoiceState('idle');
    } finally {
      abortControllerRef.current = null;
    }
  }, [sessionId, startAutoCloseCountdown]);

  const handleTranscription = useCallback(
    async (text: string, language?: string) => {
      detectedLanguageRef.current = language;
      await processVoiceInteraction(text);
    },
    [processVoiceInteraction]
  );

  const handleRecordingError = useCallback((error: Error) => {
    const message = getErrorMessage(error);
    if (message) setDisplayError(message);
    setVoiceState('idle');
  }, []);

  const { isRecording, isProcessing, error, startRecording, stopRecording, cancelRecording } =
    useVoiceRecording({
      onTranscription: handleTranscription,
      onError: handleRecordingError,
      maxDurationMs: 60000,
    });

  useEffect(() => {
    if (isRecording) setVoiceState('listening');
    else if (isProcessing) setVoiceState('processing');
  }, [isRecording, isProcessing]);

  useEffect(() => {
    if (error) {
      const message = getErrorMessage(error);
      if (message) setDisplayError(message);
    }
  }, [error]);

  const handleFABClick = () => {
    if (!browserSupported) return;
    clearAutoCloseCountdown();

    if (!isOpen) {
      setIsOpen(true);
      setDisplayError(null);
      setTranscript('');
      iosAudioPlayerRef.current.unlock();
      setTimeout(() => startRecording(), 500);
    } else {
      if (voiceState === 'listening') {
        iosAudioPlayerRef.current.unlock();
        stopRecording();
      } else {
        if (abortControllerRef.current) abortControllerRef.current.abort();
        cancelRecording();
        setIsOpen(false);
        setVoiceState('idle');
        setTranscript('');
        setDisplayError(null);
      }
    }
  };

  const stateLabels = {
    idle: { title: 'Voice Operator', desc: 'Tap to start speaking' },
    listening: { title: 'Listening...', desc: 'Speak your command' },
    processing: { title: 'Processing...', desc: 'Getting your answer' },
    speaking: { title: 'Speaking...', desc: 'Playing response' },
  };

  const labels = stateLabels[voiceState];

  return (
    <>
      {/* FAB Button — 100x100 matching landing page */}
      <motion.button
        onClick={handleFABClick}
        className="fixed bottom-6 right-6 z-50"
        whileHover={{ scale: browserSupported ? 1.05 : 1 }}
        whileTap={{ scale: browserSupported ? 0.95 : 1 }}
        disabled={!browserSupported}
        style={{
          width: 100,
          height: 100,
          opacity: browserSupported ? 1 : 0.5,
          cursor: browserSupported ? 'pointer' : 'not-allowed',
        }}
      >
        <div className="relative w-full h-full">
          {!isOpen ? (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="rounded-full p-3 shadow-2xl"
              style={{
                background: 'rgba(14, 165, 233, 0.1)',
                backdropFilter: 'blur(24px)',
                border: '2px solid rgba(14, 165, 233, 0.3)',
                boxShadow: '0 8px 32px 0 rgba(0,0,0,0.37), inset 0 1px 0 0 rgba(255,255,255,0.1)',
              }}
            >
              <LiquidMorphLogo
                src="/logos/dark_mode_brand.svg"
                alt="Voice Assistant"
                width={80}
                height={80}
                className="w-full h-full"
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-full p-4 shadow-2xl flex items-center justify-center"
              style={{
                width: 100,
                height: 100,
                background: voiceState === 'listening'
                  ? 'rgba(34, 197, 94, 0.15)'
                  : voiceState === 'speaking'
                  ? 'rgba(14, 165, 233, 0.15)'
                  : voiceState === 'processing'
                  ? 'rgba(249, 115, 22, 0.15)'
                  : 'rgba(14, 165, 233, 0.1)',
                backdropFilter: 'blur(24px)',
                border: `2px solid ${
                  voiceState === 'listening'
                    ? 'rgba(34, 197, 94, 0.4)'
                    : voiceState === 'speaking'
                    ? 'rgba(14, 165, 233, 0.4)'
                    : voiceState === 'processing'
                    ? 'rgba(249, 115, 22, 0.4)'
                    : 'rgba(14, 165, 233, 0.3)'
                }`,
                boxShadow: '0 8px 32px 0 rgba(0,0,0,0.37), inset 0 1px 0 0 rgba(255,255,255,0.1)',
              }}
            >
              {voiceState === 'listening' && (
                <svg className="w-full h-full text-[#22C55E]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}
              {voiceState === 'processing' && (
                <motion.svg
                  className="w-full h-full text-[#F97316]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity="0.3"/>
                  <path d="M12 6v6l4.5 2.7.8-1.4-3.8-2.3V6z"/>
                </motion.svg>
              )}
              {voiceState === 'speaking' && (
                <svg className="w-full h-full text-[#0EA5E9]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              )}
              {voiceState === 'idle' && isOpen && (
                <svg className="w-full h-full text-white/60" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              )}
            </motion.div>
          )}
        </div>
      </motion.button>

      {/* Voice Interface Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-28 right-6 z-40 w-80"
          >
            <div
              className="rounded-2xl p-6 shadow-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px) saturate(150%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 32px 0 rgba(0,0,0,0.37), inset 0 1px 0 0 rgba(255,255,255,0.1)',
              }}
            >
              {/* Status */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white mb-2">{labels.title}</h3>
                <p className="text-sm text-white/60">{labels.desc}</p>
              </div>

              {/* Transcript */}
              {transcript && (
                <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-white/50 mb-1">You said:</p>
                  <p className="text-sm text-white">{transcript}</p>
                </div>
              )}

              {/* Error */}
              {displayError && (
                <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <p className="text-sm" style={{ color: 'rgba(239, 68, 68, 0.8)' }}>{displayError}</p>
                </div>
              )}

              {/* Waveform Animation */}
              {voiceState === 'listening' && (
                <div className="flex items-center justify-center gap-1 h-16">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 bg-[#22C55E] rounded-full"
                      animate={{ height: [20, 40, 20] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }}
                    />
                  ))}
                </div>
              )}

              {/* Auto-Close Countdown */}
              {showAutoClosePrompt && countdown !== null && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-4 rounded-lg"
                  style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}
                >
                  <div className="text-center">
                    <p className="text-sm text-white/80 mb-3">Need anything else?</p>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="text-2xl font-bold" style={{ color: 'rgb(96, 165, 250)' }}>{countdown}</div>
                      <p className="text-xs text-white/60">seconds</p>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => {
                          clearAutoCloseCountdown();
                          iosAudioPlayerRef.current.unlock();
                          startRecording();
                        }}
                        className="px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                      >
                        Ask another
                      </button>
                      <button
                        onClick={clearAutoCloseCountdown}
                        className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 text-white/80 rounded-lg transition-colors"
                      >
                        Stay open
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                {voiceState === 'listening' && (
                  <button
                    onClick={() => {
                      iosAudioPlayerRef.current.unlock();
                      stopRecording();
                    }}
                    className="flex-1 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ background: 'rgba(14, 165, 233, 0.3)', border: '1px solid rgba(14, 165, 233, 0.5)' }}
                  >
                    Done speaking
                  </button>
                )}
                <button
                  onClick={() => {
                    if (abortControllerRef.current) abortControllerRef.current.abort();
                    cancelRecording();
                    clearAutoCloseCountdown();
                    setIsOpen(false);
                    setVoiceState('idle');
                    setTranscript('');
                    setDisplayError(null);
                  }}
                  className="flex-1 py-2 rounded-lg text-sm text-white/80"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
