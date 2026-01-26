"use client";

import { useEffect, useState, useRef } from "react";
import {
  StreamCall,
  useStreamVideoClient,
  SpeakerLayout,
  CallControls,
  StreamTheme,
} from "@stream-io/video-react-sdk";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { TranscriptPanel } from "@/app/components/transcript";
import { AlertCircle, Loader2 } from "lucide-react";

import "@stream-io/video-react-sdk/dist/css/styles.css";

export default function MeetingRoom({ callId, onLeave, userId }) {
  const client = useStreamVideoClient();
  const [call, setCall] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const joinedRef = useRef(false);
  const leavingRef = useRef(false);
  const callType = "default";

  useEffect(() => {
    if (!client) return;
    if (joinedRef.current) return;

    joinedRef.current = true;

    const init = async () => {
      try {
        const myCall = client.call(callType, callId);

        // ✅ CREATE CALL WITH TRANSCRIPTION + MEDIA ENABLED
        await myCall.getOrCreate({
          data: {
            created_by_id: userId,
            members: [{ user_id: userId, role: "call_member" }],
            settings_override: {
              audio: {
                mic_default_on: true,
                default_device: "speaker",
              },
              video: {
                camera_default_on: true,
                target_resolution: {
                  width: 640,
                  height: 480,
                },
              },
              transcription: {
                mode: "auto-on",
                language: "en",
              },
            },
          },
        });

        // ✅ JOIN CALL
        await myCall.join({ create: true });

        // ✅ EXPLICITLY ENABLE MIC & CAMERA (CRITICAL)
        await myCall.microphone.enable();
        await myCall.camera.enable();

        // ✅ START BACKEND MEETING ASSISTANT
        try {
          await fetch("http://localhost:8000/start-assistant", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ call_id: callId }),
          });
        } catch (e) {
          console.warn("Backend assistant not reachable:", e);
        }

        myCall.on("call.session_ended", () => {
          onLeave?.();
        });

        setCall(myCall);
        setIsLoading(false);

        // UI animations
        gsap.from(".video-container", {
          scale: 0.95,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
        });

        gsap.from(".controls-container", {
          y: 50,
          opacity: 0,
          duration: 0.8,
          delay: 0.3,
          ease: "power3.out",
        });

        gsap.from(".transcript-container", {
          x: 100,
          opacity: 0,
          duration: 0.8,
          delay: 0.4,
          ease: "power3.out",
        });
      } catch (err) {
        console.error("Call init error:", err);
        setError(err.message || "Failed to start meeting");
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (call && !leavingRef.current) {
        leavingRef.current = true;
        call.leave().catch(() => {});
      }
    };
  }, [client, callId, userId]);

  const handleLeaveClick = async () => {
    leavingRef.current = true;
    try {
      if (call) await call.leave();
    } catch {}
    onLeave?.();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-white">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p>{error}</p>
          <button onClick={onLeave} className="mt-4 px-6 py-2 bg-red-600 rounded">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!call || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-10 h-10 animate-spin text-white" />
      </div>
    );
  }

  return (
    <StreamTheme>
      <StreamCall call={call}>
        <div className="min-h-screen bg-black text-white">
          <div className="container mx-auto px-4 py-6 h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 h-full">
              {/* VIDEO */}
              <div className="flex flex-col gap-4">
                <div className="video-container flex-1 rounded-xl overflow-hidden border border-white/10">
                  <SpeakerLayout />
                </div>

                {/* CONTROLS */}
                <div className="controls-container flex justify-center">
                  <CallControls onLeave={handleLeaveClick} />
                </div>
              </div>

              {/* TRANSCRIPT */}
              <div className="transcript-container rounded-xl overflow-hidden border border-white/10">
                <TranscriptPanel />
              </div>
            </div>
          </div>
        </div>
      </StreamCall>
    </StreamTheme>
  );
}
