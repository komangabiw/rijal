"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  rotate: number;
  color: string;
}

const colors = ["#facc15", "#22c55e", "#3b82f6", "#f472b6", "#f97316"];

export interface GamifiedLoginCardProps {
  onSubmit?: (data: { email: string; password: string }) => Promise<void> | void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  containerClassName?: string;
}

export default function GamifiedLoginCard({
  onSubmit,
  isLoading = false,
  error = null,
  className = "",
  containerClassName = "",
}: GamifiedLoginCardProps) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const [particles, setParticles] = React.useState<ConfettiParticle[]>([]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Only allow login if both fields have input
    if (!email || !password || isLoading) return;

    // Trigger confetti
    const newParticles: ConfettiParticle[] = Array.from({ length: 30 }).map((_, i) => ({
      id: Date.now() + i,
      x: 0,
      y: 0,
      rotate: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);
    setSuccess(true);

    // Reset confetti after 1s
    setTimeout(() => setParticles([]), 1000);

    if (onSubmit) {
      await onSubmit({ email, password });
    }
  };

  return (
    <div
      className={`relative w-full flex items-center justify-center overflow-hidden ${
        containerClassName || "min-h-[520px]"
      }`}
    >
      {/* Confetti */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute w-3 h-3 rounded-full pointer-events-none z-30"
            style={{ backgroundColor: p.color }}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: p.rotate }}
            animate={{
              x: (Math.random() - 0.5) * 180,
              y: -Math.random() * 220,
              scale: 0,
              opacity: 0,
              rotate: p.rotate + Math.random() * 360,
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>

      {/* Login Card (Styled after image 3: dark slate/navy card with clean typography) */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`relative z-10 w-full max-w-md bg-[#131b2e] border border-slate-800/90 rounded-2xl shadow-2xl p-8 flex flex-col gap-6 ${className}`}
      >
        <h2 className="text-3xl font-bold text-center text-white tracking-tight">
          {success ? "Welcome!" : "Sign In"}
        </h2>

        {error && (
          <div className="p-3 text-xs rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4 mt-1">
          <div>
            <Label htmlFor="email" className="text-sm font-semibold text-slate-200 mb-1.5 block">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#0b101d] border-slate-800 text-white placeholder:text-slate-500 rounded-xl h-11 hover:scale-[1.02] focus:scale-[1.02] focus:border-slate-600 transition-all duration-200"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-semibold text-slate-200 mb-1.5 block">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              required
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-[#0b101d] border-slate-800 text-white placeholder:text-slate-500 rounded-xl h-11 hover:scale-[1.02] focus:scale-[1.02] focus:border-slate-600 transition-all duration-200"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full mt-3 h-11 bg-slate-100 hover:bg-white text-slate-950 font-semibold rounded-xl hover:scale-[1.02] transition-transform duration-200 shadow-md"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                Memverifikasi...
              </span>
            ) : (
              "Login"
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-slate-400 mt-1">
          Don’t have an account?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert("Untuk pendaftaran akun baru, silakan hubungi tim HR Admin.");
            }}
            className="text-purple-400 hover:text-purple-300 font-semibold hover:underline ml-1"
          >
            Sign up
          </a>
        </p>
      </motion.div>
    </div>
  );
}

export { GamifiedLoginCard };