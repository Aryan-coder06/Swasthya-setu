"use client";

import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";
import FuzzyText from "@/components/FuzzyText";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-6 py-16 gap-10">
      <div className="relative flex flex-col items-center gap-6">
        <div className="pointer-events-none absolute inset-0 blur-3xl bg-emerald-500/20" />
        <div className="relative flex flex-col items-center gap-6">
          <FuzzyText fontSize={200} fontWeight={800} color="#22d3ee" baseIntensity={0.12} hoverIntensity={0.24}>
            404
          </FuzzyText>
          <p className="text-lg text-slate-300 max-w-xl text-center">
            We looked everywhere in the hospital but couldn&apos;t find that page. Let&apos;s get you back to the dashboard so you can continue caring smarter.
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/">
          <Button size="lg" variant="default" className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </Link>
        <Link href="/auth">
          <Button size="lg" variant="outline" className="border-slate-700 text-slate-100 hover:bg-slate-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </Link>
      </div>
    </div>
  );
}

