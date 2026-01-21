"use client";

import { StreamVideo } from "@stream-io/video-react-sdk";
import { Chat } from "stream-chat-react";
import { useStreamClients } from "@/app/hooks/use-stream-clients";
import { motion } from "framer-motion";
import { Loader2, Video, Zap } from "lucide-react";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

export default function StreamProvider({ children, user, token }) {
  const { videoClient, chatClient } = useStreamClients({ apiKey, user, token });

  if (!videoClient || !chatClient) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 overflow-hidden">
        {/* Animated background */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [360, 180, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        />

        <div className="relative text-center">
          {/* Main loader */}
          <motion.div
            className="relative mb-8"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-2xl" />
            
            <div className="relative w-32 h-32 mx-auto">
              {/* Outer rotating ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full"
              />
              
              {/* Inner rotating ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-4 border-4 border-transparent border-b-blue-400 border-l-purple-400 rounded-full"
              />
              
              {/* Center icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full"
                >
                  <Video className="w-8 h-8 text-white" />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Loading text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-white mb-3 flex items-center justify-center gap-2">
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                Connecting
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
              >
                .
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
              >
                .
              </motion.span>
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
              >
                .
              </motion.span>
            </h2>
            <p className="text-gray-400 text-sm">Initializing video & chat services</p>
          </motion.div>

          {/* Feature indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-6 mt-8"
          >
            {[
              { icon: Video, label: "Video", delay: 0 },
              { icon: Zap, label: "Real-time", delay: 0.1 },
              { icon: Loader2, label: "AI", delay: 0.2 },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + item.delay }}
                className="flex flex-col items-center gap-2"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: item.label === "AI" ? [0, 360] : 0 
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                  className="p-2 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm"
                >
                  <item.icon className="w-5 h-5 text-blue-400" />
                </motion.div>
                <span className="text-xs text-gray-500">{item.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <StreamVideo client={videoClient}>
      <Chat client={chatClient}>{children}</Chat>
    </StreamVideo>
  );
}