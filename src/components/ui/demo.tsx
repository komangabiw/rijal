"use client";

import * as React from "react";
import { AuthFormSplitScreen } from "@/components/ui/login";

const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
      PT
    </div>
    <span className="text-xl font-bold text-white">PT Telekomunikasi</span>
  </div>
);

export function Demo() {
  const handleFormSubmit = async (data: any) => {
    console.log("Form submitted with data:", data);
  };

  return (
    <AuthFormSplitScreen
      logo={<Logo />}
      title="Welcome!"
      description="Sign in by entering the information below"
      onSubmit={handleFormSubmit}
      forgotPasswordHref="#"
      createAccountHref="#"
    />
  );
}
