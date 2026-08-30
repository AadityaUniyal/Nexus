'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, X, ChevronUp, ChevronDown, Radio } from 'lucide-react';
import { AudioWaveformVisualizer } from './AudioWaveformVisualizer';
import { useAvatarStore } from '@/lib/avatar-store';
import { tactileAudio } from '@/lib/sound-effects';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'motion/react';

export function VoiceCompanionWidget({ className = '' }: { className?: string }) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const recognitionRef = useRef<any>(null);
  const triggerAvatar = useAvatarStore((s) => s.triggerEvent);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const rec = new SpeechRec();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsListening(true);
          triggerAvatar('VOICE_LISTENING');
          tactileAudio.playTelemetryPing();
        };

        rec.onresult = (e: any) => {
          const text = Array.from(e.results)
            .map((r: any) => r[0].transcript)
            .join('');
          setTranscript(text);
        };

        rec.onerror = () => {
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const handleToggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      try {
        recognitionRef.current?.start();
      } catch {
        // Fallback if mic permission not granted
        setIsListening(false);
      }
    }
  };

  const handleSendCommand = async (textToSend?: string) => {
    const query = (textToSend || transcript || manualInput).trim();
    if (!query) return;

    triggerAvatar('AI_REQUEST');
    tactileAudio.playClick();
    setManualInput('');

    try {
      const res = await fetch('/api/v1/voice/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: query }),
      });
      const data = await res.json();
      const reply = data.speech_response || 'Command acknowledged.';
      setLastResponse(reply);

      // Trigger Avatar Speaking State
      triggerAvatar('VOICE_SPEAKING');
      setIsSpeaking(true);

      // Web Speech Synthesis
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(reply);
        utterance.rate = 1.05;
        utterance.pitch = 0.95;
        utterance.onend = () => {
          setIsSpeaking(false);
          triggerAvatar('IDLE');
        };
        window.speechSynthesis.speak(utterance);
      } else {
        setTimeout(() => {
          setIsSpeaking(false);
          triggerAvatar('IDLE');
        }, 3000);
      }

      // Broadcast voice action to active UI components (Map, Fleet Filters, Simulation Visualizer)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('nexus:voice-action', { detail: data }));
      }

      if (data.action_type === 'MAP_FLY_TO') {
        tactileAudio.playTelemetryPing();
        toast({
          title: 'Map Viewport Repositioned',
          message: data.action_payload?.speech || `Navigated to ${data.action_payload?.location_name}`,
          type: 'info',
        });
      } else if (data.action_type === 'RUN_SIMULATION') {
        tactileAudio.playSuccessChord();
        toast({
          title: 'Simulation Run Completed',
          message: `Calculated recovery of +${data.action_payload?.time_saved_mins} mins (${data.action_payload?.route_type || 'Detour'}).`,
          type: 'simulation',
        });
      }
    } catch {
      setLastResponse('Operational network standing by.');
      setIsSpeaking(false);
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 font-sans select-none ${className}`}>
      {/* Transcript & Response Bubble */}
      <AnimatePresence>
        {(expanded || transcript || lastResponse) && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="w-80 p-4 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-nexus-surface-container-high shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between border-b border-nexus-surface-container pb-2">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-nexus-primary">
                <Radio className="w-3.5 h-3.5 animate-pulse text-purple-600" />
                <span>NEXUS Tactical Voice Copilot</span>
              </div>
              <button
                onClick={() => {
                  setExpanded(false);
                  setTranscript('');
                  setLastResponse(null);
                }}
                className="text-nexus-on-surface-variant hover:text-nexus-on-surface p-0.5 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Audio Waveform */}
            <div className="flex justify-center py-1">
              <AudioWaveformVisualizer isActive={isListening || isSpeaking} isSpeaking={isSpeaking} barCount={18} />
            </div>

            {transcript && (
              <div className="p-2.5 rounded-xl bg-nexus-surface-container/60 border border-nexus-surface-container text-xs font-mono">
                <span className="text-[10px] text-nexus-on-surface-variant block uppercase font-bold">You Said</span>
                <p className="text-nexus-on-surface font-semibold">{transcript}</p>
                {isListening && (
                  <button
                    type="button"
                    onClick={() => {
                      recognitionRef.current?.stop();
                      handleSendCommand();
                    }}
                    className="mt-2 text-[10px] uppercase font-bold px-2 py-1 bg-purple-600 text-white rounded-md"
                  >
                    Execute Command
                  </button>
                )}
              </div>
            )}

            {lastResponse && (
              <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs font-mono">
                <span className="text-[10px] text-purple-700 dark:text-purple-300 block uppercase font-bold">NEXUS Voice Dispatch</span>
                <p className="text-nexus-on-surface mt-0.5">{lastResponse}</p>
              </div>
            )}

            {/* Quick Action Suggestion Chips */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-mono text-nexus-on-surface-variant uppercase font-bold">Quick Spoken Queries</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Fly map to Chicago hub',
                  'Simulate I-70 detour on NX-104',
                  'Show vehicles below 30% battery',
                ].map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTranscript(sug);
                      handleSendCommand(sug);
                    }}
                    className="text-[11px] font-mono px-2 py-1 rounded-lg bg-nexus-surface-container hover:bg-purple-100 dark:hover:bg-purple-900/40 text-nexus-on-surface transition-colors text-left"
                  >
                    "{sug}"
                  </button>
                ))}
              </div>
            </div>

            {/* Fallback Text Input */}
            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendCommand();
                }}
                placeholder="Or type operational instruction..."
                className="flex-1 px-3 py-1.5 bg-nexus-surface text-xs rounded-lg border border-nexus-surface-container-high outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button
                onClick={() => handleSendCommand()}
                className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-mono font-bold"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Tactical Push-To-Talk Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setExpanded(true);
          handleToggleMic();
        }}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-2xl border transition-all ${
          isListening
            ? 'bg-red-600 text-white border-red-400 shadow-red-500/40 animate-pulse'
            : isSpeaking
            ? 'bg-purple-600 text-white border-purple-400 shadow-purple-500/40'
            : 'bg-white dark:bg-zinc-900 text-nexus-on-surface border-nexus-surface-container-high hover:border-purple-500 shadow-xl'
        }`}
      >
        {isListening ? (
          <Mic className="w-4 h-4" />
        ) : isSpeaking ? (
          <Volume2 className="w-4 h-4 animate-bounce" />
        ) : (
          <Mic className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        )}
        <span className="text-xs font-mono font-bold uppercase tracking-wider">
          {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Voice Copilot'}
        </span>
      </motion.button>
    </div>
  );
}
