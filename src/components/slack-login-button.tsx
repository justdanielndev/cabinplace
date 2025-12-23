'use client';

import { Button } from "@/components/ui/button";
import Image from "next/image";

export function SlackLoginButton() {
  return (
    <Button 
      className="w-full h-12 text-sm font-medium bg-[#7d82b8] hover:bg-[#7d82b8]/80 text-white border-0 rounded-xl transition-all cursor-pointer shadow-lg hover:shadow-[#7d82b8]/25"
      onClick={() => window.location.href = '/api/auth/slack'}
    >
      <Image src="/letterh.svg" alt="Hack Club" width={14} height={14} className="mr-2" />
      Continue with Hack Club
    </Button>
  );
}