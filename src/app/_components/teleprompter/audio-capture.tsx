"use client";

import { useEffect, useRef } from "react";

interface AudioCaptureProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  isRecording: boolean;
  onConnectionStatusChange?: (status: 'connecting' | 'ready' | 'closed') => void;
}

export function AudioCapture({
  onTranscript,
  isRecording,
  onConnectionStatusChange
}: AudioCaptureProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const deepgramSocketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isRecording) {
      // Clean up when recording stops
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (deepgramSocketRef.current?.readyState === WebSocket.OPEN) {
        deepgramSocketRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    async function startRecording() {
      try {
        // Signal that we're connecting
        onConnectionStatusChange?.('connecting');

        // Get temporary Deepgram token from our API
        const tokenResponse = await fetch("/api/deepgram/token");
        const { token } = await tokenResponse.json() as { token: string };

        if (!token) {
          throw new Error("Failed to get Deepgram token");
        }

        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            sampleRate: 16000,
          },
        });
        streamRef.current = stream;

        // Set up MediaRecorder
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: "audio/webm",
        });

        // Connect to Deepgram WebSocket
        const socket = new WebSocket(
          "wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true",
          ["token", token]
        );

        socket.onopen = () => {
          console.log("[Deepgram] WebSocket connection opened ✓");
          // Signal that we're ready to listen
          onConnectionStatusChange?.('ready');
        };

        socket.onmessage = (message: MessageEvent<string>) => {
          const data = JSON.parse(message.data) as {
            channel?: {
              alternatives?: Array<{ transcript: string }>;
            };
            is_final?: boolean;
          };
          console.log("[Deepgram] Raw message:", data);

          const transcript = data.channel?.alternatives?.[0]?.transcript;
          const isFinal = data.is_final ?? false;

          if (transcript && transcript.length > 0) {
            console.log(
              `[Deepgram] Got transcript (${isFinal ? "final" : "interim"}):`,
              transcript
            );
            onTranscript(transcript, isFinal);
          }
        };

        socket.onerror = (error) => {
          console.error("[Deepgram] WebSocket error:", error);
        };

        socket.onclose = (event) => {
          console.log(
            `[Deepgram] Connection closed. Code: ${event.code}, Reason: ${event.reason}`
          );
          onConnectionStatusChange?.('closed');
        };

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            console.log(
              `[MediaRecorder] Audio chunk ready: ${event.data.size} bytes`
            );
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(event.data);
              console.log("[MediaRecorder] Audio sent to Deepgram");
            } else {
              console.warn(
                "[MediaRecorder] WebSocket not open, skipping audio chunk"
              );
            }
          }
        };

        mediaRecorder.onstop = () => {
          console.log("[MediaRecorder] Stopped");
        };

        mediaRecorder.onstart = () => {
          console.log("[MediaRecorder] Started recording");
        };

        // Start recording, send chunks every 100ms
        mediaRecorder.start(100);
        console.log("[MediaRecorder] Recording started, sending chunks every 100ms");

        mediaRecorderRef.current = mediaRecorder;
        deepgramSocketRef.current = socket;
      } catch (error) {
        console.error("Error starting audio capture:", error);
      }
    }

    void startRecording();

    return () => {
      // Cleanup on unmount
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (deepgramSocketRef.current?.readyState === WebSocket.OPEN) {
        deepgramSocketRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isRecording, onTranscript, onConnectionStatusChange]);

  return null; // No UI, just audio handling
}
