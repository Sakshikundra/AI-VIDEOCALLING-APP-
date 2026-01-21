"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import StreamProvider from "@/app/components/stream-provider";
import MeetingRoom from "@/app/components/meeting-room";
import { StreamTheme } from "@stream-io/video-react-sdk";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Shield } from "lucide-react";

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const callId = params.id;
  const name = searchParams.get("name") || "anonymous";

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser({
      id: name.toLowerCase().replace(/\s+/g, "-"),
      name,
    });
  }, [name]);

  useEffect(() => {
    if (!user) return;

    setIsLoading(true);
    
    fetch("/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          setToken(data.token);
        } else {
          setError("No token returned");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [user]);

  const handleLeave = () => {
    router.push("/");
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-red-950/20 to-slate-900">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="text-center max-w-md p-8"
        >
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-2xl" />
            <div className="relative inline-block p-6 bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 rounded-full backdrop-blur-sm">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                <Shield className="w-16 h-16 text-red-400" />
              </motion.div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3">Authentication Error</h2>
          <p className="text-gray-400 mb-2">{error}</p>
          <p className="text-gray-500 text-sm mb-6">
            Unable to verify your credentials. Please try again.
          </p>

          <motion.button
            onClick={() => router.push("/")}
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

  if (!token || !user || isLoading) {
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
              className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full mx-auto"
            />
            <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-blue-400 animate-pulse" />
          </div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-white mb-2"
          >
            Preparing Your Meeting
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-400"
          >
            Setting up secure connection...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <StreamProvider user={user} token={token}>
          <StreamTheme>
            <MeetingRoom callId={callId} onLeave={handleLeave} userId={user.id} />
          </StreamTheme>
        </StreamProvider>
      </motion.div>
    </AnimatePresence>
  );
}