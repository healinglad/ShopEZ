import { useState, useCallback, useRef } from 'react';

export function useVoiceInput() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);

    // Keep a ref to the active recognition instance so we can abort it
    const recognitionRef = useRef(null);

    const startListening = useCallback(() => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError('Speech recognition is not supported in this browser.');
            return;
        }

        // Abort any in-flight recognition before starting a new one
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (_) {}
            recognitionRef.current = null;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN';

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
            setTranscript('');
        };

        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const text = event.results[last][0].transcript;
            setTranscript(text);
        };

        recognition.onerror = (event) => {
            // 'no-speech' and 'aborted' are non-critical — don't surface as errors
            if (event.error !== 'no-speech' && event.error !== 'aborted') {
                setError(event.error);
            }
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, []);

    const resetTranscript = useCallback(() => setTranscript(''), []);

    return { isListening, transcript, error, startListening, resetTranscript };
}
