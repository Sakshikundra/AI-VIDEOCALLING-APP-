"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { Video, Sparkles, ArrowRight, Users, Shield, Zap } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const heroRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    // GSAP entrance animations
    const ctx = gsap.context(() => {
      gsap.from(".hero-title", {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
      });
      
      gsap.from(".hero-subtitle", {
        y: 30,
        opacity: 0,
        duration: 1,
        delay: 0.2,
        ease: "power4.out",
      });

      gsap.from(".feature-card", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        delay: 0.4,
        ease: "power3.out",
      });

      gsap.from(".join-card", {
        scale: 0.9,
        opacity: 0,
        duration: 1,
        delay: 0.6,
        ease: "back.out(1.7)",
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const handleJoin = () => {
    const name = username.trim() === "" ? "anonymous" : username.trim();
    const meetingId = process.env.NEXT_PUBLIC_CALL_ID || "meeting-" + Math.random().toString(36).substring(2, 10);
    router.push(`/meeting/${meetingId}?name=${encodeURIComponent(name)}`);
  };

  const features = [
    { icon: Video, title: "HD Video", desc: "Crystal clear quality" },
    { icon: Shield, title: "Secure", desc: "End-to-end encrypted" },
    { icon: Zap, title: "Fast", desc: "Ultra-low latency" },
  ];

  return (
    <div
      ref={heroRef}
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900"
    >
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12 max-w-4xl">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-blue-500/10 border border-blue-500/30 rounded-full backdrop-blur-sm"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-blue-300 text-sm font-medium">AI-Powered Video Calling</span>
          </motion.div>

          <h1 className="hero-title text-5xl md:text-7xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-purple-200">
            Connect Seamlessly
          </h1>
          
          <p className="hero-subtitle text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            Experience next-generation video calling with live transcription, crystal-clear audio, and intelligent features.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12 max-w-4xl w-full px-4">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5, scale: 1.02 }}
              className="feature-card group relative"
            >
              <div className="relative p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-500" />
                
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{feature.title}</h3>
                    <p className="text-gray-400 text-sm">{feature.desc}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Join Card */}
        <motion.div
          ref={cardRef}
          className="join-card w-full max-w-md"
          whileHover={{ scale: 1.02 }}
        >
          <div className="relative p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/20 backdrop-blur-2xl shadow-2xl">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl opacity-50" />
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Join Meeting</h2>
                  <p className="text-gray-400 text-sm">Enter your name to get started</p>
                </div>
              </div>

              <motion.div
                animate={{
                  scale: isFocused ? 1.02 : 1,
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <input
                  className="w-full px-5 py-4 rounded-xl bg-white/5 border-2 border-white/10 text-white placeholder-gray-400 focus:border-blue-500 focus:bg-white/10 outline-none transition-all duration-300 backdrop-blur-sm"
                  placeholder="Your name (optional)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyPress={(e) => e.key === "Enter" && handleJoin()}
                />
              </motion.div>

              <motion.button
                onClick={handleJoin}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-6 w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/50 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <span>Join Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <p className="mt-4 text-center text-gray-500 text-xs">
                By joining, you agree to our Terms & Privacy Policy
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}