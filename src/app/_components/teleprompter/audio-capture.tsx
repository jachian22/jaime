"use client";

import { useEffect, useRef } from "react";

interface AudioCaptureProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  isRecording: boolean;
  onConnectionStatusChange?: (status: 'connecting' | 'ready' | 'closed') => void;
  onError?: (error: string) => void;
}

export function AudioCapture({
  onTranscript,
  isRecording,
  onConnectionStatusChange,
  onError
}: AudioCaptureProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const deepgramSocketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(isRecording);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep isRecordingRef in sync
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording) {
      // Clean up when recording stops
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
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

        // Reuse existing stream or request new microphone access
        let stream = streamRef.current;
        if (!stream?.active) {
          console.log("[AudioCapture] Requesting microphone access...");
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              channelCount: 1,
              // Don't specify sampleRate - let browser use its native rate
            },
          });
          streamRef.current = stream;
        } else {
          console.log("[AudioCapture] Reusing existing audio stream");
        }

        // Get the actual sample rate from the audio track
        const audioTrack = stream.getAudioTracks()[0];
        let actualSampleRate = 16000; // Default fallback

        if (audioTrack) {
          const settings = audioTrack.getSettings();
          actualSampleRate = settings.sampleRate ?? 16000;
          console.log("[AudioCapture] 🎤 Audio track settings:", {
            sampleRate: settings.sampleRate,
            channelCount: settings.channelCount,
            deviceId: settings.deviceId,
          });
        }

        // Set up or reuse MediaRecorder
        let mediaRecorder = mediaRecorderRef.current;
        if (!mediaRecorder || mediaRecorder.state === "inactive") {
          console.log("[AudioCapture] Creating new MediaRecorder...");
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: "audio/webm",
          });
          mediaRecorderRef.current = mediaRecorder;
        } else {
          console.log("[AudioCapture] Reusing existing MediaRecorder");
        }

        // Connect to Deepgram WebSocket
        // IMPORTANT: Tell Deepgram the actual sample rate we're sending
        console.log(`[AudioCapture] 🔌 Connecting to Deepgram with sample_rate=${actualSampleRate}`);
        const socket = new WebSocket(
          `wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true&sample_rate=${actualSampleRate}`,
          ["token", token]
        );
        deepgramSocketRef.current = socket;

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
            type?: string;
            error?: string;
          };

          // Log full message with stringified JSON to see everything
          console.log("[Deepgram] Raw message:", JSON.stringify(data, null, 2));

          // Check for errors in metadata
          if (data.error) {
            console.error("[Deepgram] Error in message:", data.error);
          }

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
            `[Deepgram] Connection closed. Code: ${event.code}, Reason: ${event.reason || 'No reason'}`
          );
          onConnectionStatusChange?.('closed');

          // Auto-reconnect if still recording (e.g., Deepgram closed due to inactivity)
          if (isRecordingRef.current && event.code === 1000) {
            console.log('[Deepgram] Auto-reconnecting in 1 second...');
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isRecordingRef.current) {
                console.log('[Deepgram] Reconnecting...');
                void startRecording();
              }
            }, 1000);
          }
        };

        // Set up MediaRecorder handlers (only if new or inactive)
        if (mediaRecorder.state === "inactive") {
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              console.log(
                `[MediaRecorder] Audio chunk ready: ${event.data.size} bytes`
              );
              // Use ref to always send to current WebSocket
              const currentSocket = deepgramSocketRef.current;
              if (currentSocket && currentSocket.readyState === WebSocket.OPEN) {
                currentSocket.send(event.data);
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
        }
      } catch (error) {
        console.error("Error starting audio capture:", error);
        onConnectionStatusChange?.('closed');

        if (error instanceof Error) {
          onError?.(error.message);
        } else {
          onError?.("Failed to start recording");
        }
      }
    }

    void startRecording();

    return () => {
      // Cleanup on unmount
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
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
  }, [isRecording, onTranscript, onConnectionStatusChange, onError]);

  return null; // No UI, just audio handling
}
