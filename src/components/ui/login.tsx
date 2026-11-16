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
import { Loader2 } from "lucide-react";

// Validation schema for the form
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." }),
  rememberMe: z.boolean().default(false).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AuthFormSplitScreenProps {
  logo: React.ReactNode;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  onSubmit: (data: FormValues) => Promise<void>;
  forgotPasswordHref: string;
  createAccountHref: string;
  extraContent?: React.ReactNode;
}

/**
 * A responsive, split-screen authentication form component.
 * @param logo - The component to be used as the logo (e.g., an SVG or text).
 * @param title - The main heading for the form.
 * @param description - A short description below the title.
 * @param imageSrc - URL for the image to display on the right panel.
 * @param imageAlt - Alt text for the image for accessibility.
 * @param onSubmit - Async function to handle form submission.
 * @param forgotPasswordHref - URL for the "Forgot Password" link.
 * @param createAccountHref - URL for the "Create Account" link.
 */
export function AuthFormSplitScreen({
  logo,
  title,
  description,
  imageSrc,
  imageAlt,
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

  // Animation variants for staggering children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col md:flex-row bg-slate-950 text-slate-100">
      {/* Left Panel: Form */}
      <div className="flex w-full flex-col items-center justify-center p-6 sm:p-10 md:w-1/2 lg:w-5/12 bg-slate-900/90 border-r border-slate-800">
        <div className="w-full max-w-md">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-5"
          >
            <motion.div variants={itemVariants} className="mb-1">
              {logo}
            </motion.div>
            <motion.div variants={itemVariants} className="text-left">
              <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
              <p className="text-xs text-slate-400 mt-1">{description}</p>
            </motion.div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleFormSubmit)}
                className="space-y-4"
              >
                <motion.div variants={itemVariants}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-slate-300">Email Perusahaan</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="admin@telekomunikasi.co.id"
                            {...field}
                            disabled={isLoading}
                            className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 text-xs focus-visible:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-400" />
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
                        <FormLabel className="text-xs text-slate-300">Kata Sandi</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••••••"
                            {...field}
                            disabled={isLoading}
                            className="bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 text-xs focus-visible:ring-blue-500"
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-400" />
                      </FormItem>
                    )}
                  />
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="flex items-center justify-between"
                >
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                            className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                        </FormControl>
                        <div className="leading-none">
                          <FormLabel className="font-normal text-xs text-slate-400 cursor-pointer">
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

                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 shadow-lg shadow-blue-600/30"
                    disabled={isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Masuk ke Dashboard Portal
                  </Button>
                </motion.div>
              </form>
            </Form>

            {extraContent && (
              <motion.div variants={itemVariants} className="pt-2">
                {extraContent}
              </motion.div>
            )}

            <motion.p
              variants={itemVariants}
              className="text-center text-xs text-slate-500"
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

      {/* Right Panel: Image with Telecom theme */}
      <div className="relative hidden w-full md:block md:w-1/2 lg:w-7/12 overflow-hidden bg-slate-950">
        <img
          src={imageSrc}
          alt={imageAlt}
          className="h-full w-full object-cover opacity-85 scale-105 hover:scale-100 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        
        {/* Ambient overlay info */}
        <div className="absolute bottom-8 left-8 right-8 text-white space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
            <span>Telecommunication Infrastructure Backbone</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">PT Telekomunikasi Indonesia</h2>
          <p className="text-xs text-slate-300 max-w-lg">
            Sistem ERP dan Operasional Terpadu: Monitoring Penggelaran Fiber Optik ADSS, Menara BTS Macro 5G, Geofencing Presensi, & Distribusi Material Logistik.
          </p>
        </div>
      </div>
    </div>
  );
}
