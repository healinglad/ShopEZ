import React, { useState, useEffect } from 'react';
import { Mic, Send, MicOff } from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { cn } from '../lib/utils';

export function InputArea({ onAddItem }) {
    const [inputValue, setInputValue] = useState('');
    const { isListening, transcript, startListening, resetTranscript } = useVoiceInput();

    useEffect(() => {
        if (transcript) {
            setInputValue(transcript);
        }
    }, [transcript]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            onAddItem(inputValue);
            setInputValue('');
            resetTranscript();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative w-full shadow-md rounded-2xl bg-white p-2 flex items-center border border-gray-100">
            <button
                type="button"
                onClick={startListening}
                className={cn(
                    "p-3 rounded-xl transition-all duration-300",
                    isListening
                        ? "bg-red-100 text-red-600 animate-pulse"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
            >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={isListening ? "Listening..." : "Add item (e.g. Milk)"}
                className="flex-1 ml-3 bg-transparent outline-none text-lg text-gray-800 placeholder-gray-400"
            />

            <button
                type="submit"
                disabled={!inputValue.trim()}
                className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <Send className="w-5 h-5" />
            </button>
        </form>
    );
}
