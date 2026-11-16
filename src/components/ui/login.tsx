"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Radio, Server, Wifi, Network, ShieldCheck, MapPin, Truck } from "lucide-react";

// Validation schema for the form
const formSchema = z.object({
  email: z.string().email({ message: "Masukkan email yang valid." }),
  password: z
    .string()
    .min(6, { message: "Kata sandi minimal 6 karakter." }),
  rememberMe: z.boolean().default(false).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AuthFormSplitScreenProps {
  logo: React.ReactNode;
  title: string;
  description: string;
  onSubmit: (data: FormValues) => Promise<void>;
  forgotPasswordHref: string;
  createAccountHref: string;
  extraContent?: React.ReactNode;
}

export function AuthFormSplitScreen({
  logo,
  title,
  description,
  onSubmit,
  forgotPasswordHref,
  createAccountHref,
  extraContent,
}: AuthFormSplitScreenProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const handleFormSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="relative flex h-screen w-full flex-col md:flex-row bg-zinc-950 text-zinc-100 overflow-hidden select-none">
      {/* Left Panel: Compact Form designed to fit 1 screen without scrolling */}
      <div className="flex w-full flex-col justify-center px-6 sm:px-10 lg:px-12 py-6 md:w-1/2 lg:w-5/12 bg-zinc-900/90 border-r border-zinc-800/80 h-full overflow-y-auto scrollbar-none">
        <div className="w-full max-w-sm mx-auto my-auto space-y-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3.5"
          >
            <motion.div variants={itemVariants}>
              {logo}
            </motion.div>

            <motion.div variants={itemVariants} className="text-left">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{title}</h1>
              <p className="text-xs text-zinc-400 mt-0.5">{description}</p>
            </motion.div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleFormSubmit)}
                className="space-y-3"
              >
                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-zinc-300">Email Perusahaan</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="admin@telekomunikasi.co.id"
                            {...field}
                            disabled={isLoading}
                            className="h-9 bg-zinc-800/90 border-zinc-700 text-white placeholder:text-zinc-500 text-xs focus-visible:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-zinc-300">Kata Sandi</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••••••"
                            {...field}
                            disabled={isLoading}
                            className="h-9 bg-zinc-800/90 border-zinc-700 text-white placeholder:text-zinc-500 text-xs focus-visible:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage className="text-[10px]" />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="flex items-center justify-between pt-0.5"
                >
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                            className="border-zinc-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                        </FormControl>
                        <div className="leading-none">
                          <FormLabel className="text-xs font-normal text-zinc-400 cursor-pointer">
                            Ingat Saya
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <a
                    href={forgotPasswordHref}
                    className="text-xs font-medium text-blue-400 hover:underline"
                  >
                    Lupa Password?
                  </a>
                </motion.div>

                <motion.div variants={itemVariants} className="pt-1">
                  <Button
                    type="submit"
                    className="w-full h-9 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition-all active:scale-[0.98]"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    )}
                    Masuk ke Dashboard Portal
                  </Button>
                </motion.div>
              </form>
            </Form>

            {extraContent && (
              <motion.div variants={itemVariants} className="pt-1">
                {extraContent}
              </motion.div>
            )}

            <motion.p
              variants={itemVariants}
              className="text-center text-[11px] text-zinc-500 pt-0.5"
            >
              Belum memiliki akun resmi?{" "}
              <a
                href={createAccountHref}
                className="font-medium text-blue-400 hover:underline"
              >
                Hubungi HR Admin
              </a>
              .
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel: Pure Telecommunications Technology Icons & Infrastructure Visualizer */}
      <div className="relative hidden w-full md:flex md:w-1/2 lg:w-7/12 flex-col justify-between p-8 lg:p-12 overflow-hidden bg-zinc-950">
        {/* Futuristic glowing cyber grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.25),rgba(255,255,255,0))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60" />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Telecommunication Infrastructure System</span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono">
            PT TELEKOMUNIKASI • EDGE v2026
          </div>
        </div>

        {/* Center: Interactive Telecom Hardware Architecture Grid */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-3 gap-3.5 my-auto max-w-xl mx-auto w-full">
          {/* Card 1: Menara BTS 5G */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-blue-500/60 transition-all duration-300 group shadow-lg backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-700/50 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <Wifi className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white mt-3 group-hover:text-blue-400 transition-colors">
              Menara BTS & Macro 5G
            </h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              Instalasi BBU/RRU, radio microwave & aktivasi site seluler.
            </p>
          </div>

          {/* Card 2: Backbone Fiber Optic */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/60 transition-all duration-300 group shadow-lg backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white mt-3 group-hover:text-emerald-400 transition-colors">
              Backbone Fiber Optic
            </h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              Kabel ADSS 24C/48C/96C jalur udara & duct bawah tanah.
            </p>
          </div>

          {/* Card 3: Distribution ODC & ODP */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/60 transition-all duration-300 group shadow-lg backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white mt-3 group-hover:text-amber-400 transition-colors">
              ODC & ODP Enclosures
            </h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              Optical cabinet 144 core, closure dome & splitter solid 16P.
            </p>
          </div>

          {/* Card 4: GPS Geofencing Telemetry */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-cyan-500/60 transition-all duration-300 group shadow-lg backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white mt-3 group-hover:text-cyan-400 transition-colors">
              GPS Geofencing Presensi
            </h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              Validasi jarak radius kerja kantor & bukti selfie kamera live.
            </p>
          </div>

          {/* Card 5: Fleet & Logistik Surat Jalan */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-purple-500/60 transition-all duration-300 group shadow-lg backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-700/50 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white mt-3 group-hover:text-purple-400 transition-colors">
              Logistik & Surat Jalan
            </h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              Tracking armada, alokasi material gudang & konfirmasi POD.
            </p>
          </div>

          {/* Card 6: Enterprise Security */}
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-rose-500/60 transition-all duration-300 group shadow-lg backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-700/50 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-white mt-3 group-hover:text-rose-400 transition-colors">
              RLS & Data Security
            </h3>
            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              Enkripsi database PostgreSQL, audit trail & role berbasis RLS.
            </p>
          </div>
        </div>

        {/* Bottom Status bar */}
        <div className="relative z-10 flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800/80 pt-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-zinc-300 font-medium">99.98% Network SLA Uptime</span>
          </div>
          <span>Cloudflare Edge • Supabase PostgreSQL</span>
        </div>
      </div>
    </div>
  );
}
