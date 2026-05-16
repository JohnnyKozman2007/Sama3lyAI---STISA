import { useEffect, useRef, useState, useCallback } from "react";
import { pcmToBase64, base64ToPcm } from "../lib/audio-utils";

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export function useGeminiLive() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const [isMicActive, setIsMicActive] = useState(false);
  const isMicActiveRef = useRef(false);

  const interrupt = useCallback(() => {
    // Hard stop all playing audio sources
    activeSourcesRef.current.forEach(source => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source might have already ended or not started yet
      }
    }); activeSourcesRef.current = [];
    
    // Reset the scheduler to current time
    if (audioContextRef.current) {
      nextStartTimeRef.current = audioContextRef.current.currentTime;
    }
    setIsSpeaking(false);
    console.log("Interrupted: Cleared all audio sources");
  }, []);

  const stopMic = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsMicActive(false);
    isMicActiveRef.current = false;
  }, []);

  const playAudioChunk = useCallback((base64Audio: string) => {
    if (!audioContextRef.current || isMicActiveRef.current) return;

    const float32Data = base64ToPcm(base64Audio);
    const buffer = audioContextRef.current.createBuffer(1, float32Data.length, 16000);
    buffer.getChannelData(0).set(float32Data);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);

    // Schedule playback to avoid gaps/jitters
    const now = audioContextRef.current.currentTime;
    const startTime = Math.max(now, nextStartTimeRef.current);
    
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter(s => s !== source);
      if (activeSourcesRef.current.length === 0) {
        setIsSpeaking(false);
      }
    };

    activeSourcesRef.current.push(source);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;
  }, []);

  const connect = useCallback(async () => {
    try {
      setError(null);
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        // Handle Gemini server messages
        if (message.serverContent?.modelTurn?.parts) {
          const parts = message.serverContent.modelTurn.parts;
          for (const part of parts) {
            if (part.inlineData?.data) {
              playAudioChunk(part.inlineData.data);
              setIsSpeaking(true);
            }
          }
        }

        // Server-side Voice Activity Detection interruption
        if (message.serverContent?.interrupted) {
          interrupt();
        }

        // Transcription
        if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
          const text = message.serverContent.modelTurn.parts[0].text;
          setTranscript(prev => [...prev, { role: "model", text }]);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
        setError("Connection error. Please try again.");
      };

      ws.onclose = () => {
        setIsConnected(false);
        stopMic();
      };

    } catch (err) {
      console.error("Failed to connect:", err);
      setError("Could not establish connection.");
    }
  }, [playAudioChunk, stopMic, interrupt]);

  const startMic = useCallback(async () => {
    if (!isConnected || !wsRef.current) return;

    try {
      // Shuts up immediately when user activates mic
      interrupt();

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      }
      
      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setIsMicActive(true);
      isMicActiveRef.current = true;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const base64 = pcmToBase64(inputData);
        
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            realtimeInput: {
              audio: { data: base64, mimeType: "audio/pcm;rate=16000" }
            }
          }));
        }
      };

    } catch (err) {
      console.error("Mic error:", err);
      setError("Microphone access denied or error.");
    }
  }, [isConnected, interrupt]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    stopMic();
    interrupt();
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [stopMic, interrupt]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isSpeaking,
    isMicActive,
    transcript,
    error,
    connect,
    disconnect,
    startMic,
    stopMic,
    interrupt,
  };

}
