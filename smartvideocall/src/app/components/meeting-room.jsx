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
  const [permissionWarning, setPermissionWarning] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const joinedRef = useRef(false);
  const leavingRef = useRef(false);
  const containerRef = useRef(null);
  const callType = "default";

  useEffect(() => {
    if (!client) return;
    if (joinedRef.current) return;

    joinedRef.current = true;

    const init = async () => {
      try {
        const myCall = client.call(callType, callId);

        let hasVideo = false;
        let hasAudio = false;

        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          const audioDevices = devices.filter(d => d.kind === 'audioinput');
          
          if (videoDevices.length > 0) {
            try {
              const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
              videoStream.getTracks().forEach(track => track.stop());
              hasVideo = true;
            } catch {
              setPermissionWarning("Camera unavailable - joining with audio only");
            }
          } else {
            setPermissionWarning("No camera detected");
          }

          if (audioDevices.length > 0) {
            try {
              const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              audioStream.getTracks().forEach(track => track.stop());
              hasAudio = true;
            } catch {
              setPermissionWarning(prev => prev ? prev + " & mic unavailable" : "Microphone unavailable");
            }
          }
        } catch (e) {
          console.log("Could not enumerate devices:", e);
        }

        await myCall.getOrCreate({
          data: {
            created_by_id: userId,
            members: [{ user_id: userId, role: "call_member" }],
            settings_override: {
              audio: {
                mic_default_on: hasAudio,
              },
              video: {
                camera_default_on: hasVideo,
              },
            },
          },
        });

        await myCall.join({ create: true });

        try {
          await myCall.startClosedCaptions({ language: "en" });
        } catch (e) {
          console.log("Could not start closed captions:", e);
        }

        myCall.on("call.session_ended", () => {
          console.log("Session ended");
          onLeave?.();
        });

        setCall(myCall);
        setIsLoading(false);

        // Animate UI entrance
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
        setError(err.message);
        setIsLoading(false);
      }
    };

    init();

    return () => {
      if (call && !leavingRef.current) {
        leavingRef.current = true;
        call.stopClosedCaptions().catch(() => {});
        call.leave().catch(() => {});
      }
    };
  }, [client, callId, userId]);

  const handleLeaveClick = async () => {
    if (leavingRef.current) {
      onLeave?.();
      return;
    }

    leavingRef.current = true;

    try {
      if (call) {
        await call.stopClosedCaptions().catch(() => {});
        await call.leave().catch(() => {});
      }
    } catch (err) {
      console.error("Error leaving call:", err);
    } finally {
      onLeave?.();
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-900">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-8 max-w-md"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl" />
            <div className="relative p-6 bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-full border border-red-500/30 backdrop-blur-sm inline-block">
              <AlertCircle className="w-16 h-16 text-red-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">Connection Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          
          <motion.button
            onClick={onLeave}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl font-semibold text-white shadow-lg shadow-red-500/30 transition-all"
          >
            Return Home
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!call || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="relative mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full mx-auto"
            />
            <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-blue-400 animate-pulse" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">Connecting to Meeting</h2>
          <p className="text-gray-400">Please wait while we set things up...</p>
          
          <AnimatePresence>
            {permissionWarning && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl backdrop-blur-sm inline-block"
              >
                <p className="text-yellow-400 text-sm">{permissionWarning}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  return (
    <StreamTheme>
      <StreamCall call={call}>
        <div
          ref={containerRef}
          className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white"
        >
          <AnimatePresence>
            {permissionWarning && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-gradient-to-r from-yellow-600/20 via-yellow-500/20 to-yellow-600/20 border-b border-yellow-500/30 px-4 py-3 text-center backdrop-blur-sm"
              >
                <p className="text-yellow-300 text-sm font-medium flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {permissionWarning}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="container mx-auto px-4 py-6 h-screen">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 h-full">
              {/* Video Section */}
              <div className="flex flex-col gap-4">
                <motion.div
                  className="video-container flex-1 rounded-2xl overflow-hidden relative group"
                  whileHover={{ scale: 1.005 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {/* Ambient glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  <div className="relative h-full bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
                    <SpeakerLayout />
                  </div>
                </motion.div>

                {/* Controls */}
                <motion.div
                  className="controls-container flex justify-center pb-4"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="relative group">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-full px-8 py-4 border border-white/10 backdrop-blur-xl shadow-2xl">
                      <CallControls onLeave={handleLeaveClick} />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Transcript Panel */}
              <motion.div
                className="transcript-container rounded-2xl overflow-hidden"
                whileHover={{ scale: 1.005 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="h-full bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl">
                  <TranscriptPanel />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </StreamCall>
    </StreamTheme>
  );
}