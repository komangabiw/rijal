"use client";

import { AuthFormSplitScreen } from "@/components/ui/login";
import { Radio } from "lucide-react";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function AuthFormSplitScreenDemo() {
  const handleLogin = async (data: any) => {
    console.log("Form submitted with:", data);
    await sleep(1500);
    alert("Login successful!");
  };

  return (
    <AuthFormSplitScreen
      logo={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <span className="font-bold text-white text-base tracking-wide">
            PT TELEKOMUNIKASI
          </span>
        </div>
      }
      title="Welcome!"
      description="Sign in by entering the information below"
      imageSrc="https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&q=80"
      imageAlt="Telecommunication fiber optic and infrastructure"
      onSubmit={handleLogin}
      forgotPasswordHref="#"
      createAccountHref="#"
    />
  );
}
