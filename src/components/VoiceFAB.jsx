import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { cn } from '../lib/utils';

export function VoiceFAB({ onResult }) {
    const { isListening, transcript, startListening, resetTranscript } = useVoiceInput();
    const [showTranscript, setShowTranscript] = useState(false);

    // Auto-submit when silence is detected or manually? 
    // For now, let's keep it manual or auto-after-pause.
    // We'll use a simple "tap to start, auto-finish" logic if possible, 
    // or just two taps.

    useEffect(() => {
        if (transcript) {
            setShowTranscript(true);
            // Simple debounce to simulate "done speaking"
            const timer = setTimeout(() => {
                if (transcript.trim()) {
                    onResult(transcript);
                    resetTranscript();
                    setShowTranscript(false);
                }
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [transcript, onResult, resetTranscript]);


    return (
        <div className="fixed bottom-24 right-5 z-50">
            <AnimatePresence>
                {showTranscript && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute bottom-20 right-0 mb-4 bg-white px-4 py-2 rounded-2xl shadow-xl border border-brand-100 whitespace-nowrap"
                    >
                        <p className="text-brand-800 font-medium flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-accent-500" />
                            {transcript}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                onClick={startListening}
                whileTap={{ scale: 0.9 }}
                animate={{
                    scale: isListening ? 1.1 : 1,
                    boxShadow: isListening ? "0 0 0 10px rgba(124, 58, 237, 0.2)" : "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                }}
                className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl transition-colors",
                    isListening
                        ? "bg-accent-500" // Pulse color
                        : "bg-brand-600"
                )}
            >
                {isListening ? (
                    <MicOff className="w-8 h-8 animate-pulse" />
                ) : (
                    <Mic className="w-8 h-8" />
                )}
            </motion.button>
        </div>
    );
}
