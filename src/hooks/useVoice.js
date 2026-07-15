import { useState, useEffect, useRef } from 'react';

const useVoice = () => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check compatibility
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setListening(false);
      };

      rec.onend = () => {
        setListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const startListening = () => {
    if (!supported || !recognitionRef.current) return;
    setTranscript('');
    setListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!supported || !recognitionRef.current) return;
    setListening(false);
    recognitionRef.current.stop();
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    // Cancel ongoing speak requests
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Select standard English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  return {
    supported,
    listening,
    transcript,
    setTranscript,
    startListening,
    stopListening,
    speak
  };
};

export default useVoice;
