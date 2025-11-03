"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CountUp from "@/components/CountUp";

interface LoadingScreenProps {
  children: React.ReactNode;
  durationMs?: number;
}

const LOADING_DURATION_DEFAULT = 2000;
const DOT_LOTTIE_SRC = "https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs";
const DOT_LOTTIE_ANIMATION = "https://lottie.host/eaaeb0f0-21d5-4a70-97ae-17e8da49501a/8zsheyGAO1.lottie";

declare global {
  interface Window {
    __dotlottiePlayerLoaded?: boolean;
  }
  namespace JSX {
    interface IntrinsicElements {
      "dotlottie-player": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        loop?: boolean;
        autoplay?: boolean;
        background?: string;
        speed?: number;
        mode?: string;
      };
    }
  }
}

export default function LoadingScreen({ children, durationMs = LOADING_DURATION_DEFAULT }: LoadingScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [lottieReady, setLottieReady] = useState<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__dotlottiePlayerLoaded) {
      setLottieReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = DOT_LOTTIE_SRC;
    script.type = "module";
    script.async = true;
    script.onload = () => {
      window.__dotlottiePlayerLoaded = true;
      setLottieReady(true);
    };
    script.onerror = () => {
      setLottieReady(false);
    };
    document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="swasthya-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-slate-950 text-white"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center space-y-6 px-6"
            >
              {lottieReady && (
                <div className="w-48 h-48">
                  <dotlottie-player
                    src={DOT_LOTTIE_ANIMATION}
                    autoplay
                    loop
                    style={{ width: "100%", height: "100%" }}
                  />
                </div>
              )}
              <div className="flex flex-col items-center space-y-3">
                <motion.span
                  initial={{ opacity: 0, letterSpacing: "0.4em" }}
                  animate={{ opacity: 1, letterSpacing: "0.3em" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="text-sm uppercase tracking-[0.3em] text-cyan-200/80"
                >
                  SwasthyaSetu
                </motion.span>
                <div className="text-5xl font-bold text-emerald-300">
                  <CountUp to={100} duration={durationMs / 1000} startWhen={isLoading} className="tabular-nums" />
                  <span className="ml-1 text-emerald-200 text-2xl align-top">%</span>
                </div>
                <div className="w-72 h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    key="progress-bar"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: durationMs / 1000, ease: "easeInOut" }}
                    className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400"
                  />
                </div>
                <p className="text-sm text-slate-300/80 max-w-sm text-center">
                  Calibrating your connected care experience&hellip;
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </>
  );
}
