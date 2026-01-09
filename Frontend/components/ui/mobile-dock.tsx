"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  Users,
  Hospital,
  User,
  ClipboardList,
  Activity,
  Stethoscope,
  Bed,
  Receipt,
} from "lucide-react";

type DockItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const patientItems: DockItem[] = [
  { label: "Home", href: "/patient", icon: Home },
  { label: "Visits", href: "/patient/appointments", icon: Calendar },
  { label: "Hospitals", href: "/patient/hospitals", icon: Hospital },
  { label: "Family", href: "/patient/family", icon: Users },
  { label: "Profile", href: "/patient/profile", icon: User },
];

const doctorItems: DockItem[] = [
  { label: "Home", href: "/doctor", icon: Stethoscope },
  { label: "Schedule", href: "/doctor/appointments", icon: Calendar },
  { label: "Patients", href: "/doctor/patients", icon: Users },
  { label: "Records", href: "/doctor/records", icon: ClipboardList },
  { label: "Profile", href: "/doctor/profile", icon: User },
];

const receptionistItems: DockItem[] = [
  { label: "Home", href: "/receptionist", icon: Activity },
  { label: "Desk", href: "/receptionist/appointments", icon: Calendar },
  { label: "Walk-in", href: "/receptionist/walkin", icon: Users },
  { label: "Billing", href: "/receptionist/billing", icon: Receipt },
  { label: "Beds", href: "/receptionist/beds", icon: Bed },
];

const defaultItems: DockItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Hospitals", href: "/patient/hospitals", icon: Hospital },
  { label: "AI", href: "/patient/ai-consultation", icon: Activity },
  { label: "Profile", href: "/auth", icon: User },
];

const resolveItems = (pathname: string): DockItem[] => {
  if (pathname.startsWith("/patient")) return patientItems;
  if (pathname.startsWith("/doctor")) return doctorItems;
  if (pathname.startsWith("/receptionist")) return receptionistItems;
  return defaultItems;
};

export default function MobileDock() {
  const pathname = usePathname();
  const items = useMemo(() => resolveItems(pathname), [pathname]);

  return (
    <motion.div
      className="fixed bottom-4 left-1/2 z-40 w-[92vw] max-w-md -translate-x-1/2 rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur md:hidden"
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 140, damping: 18 }}
    >
      <motion.div
        className="flex items-center gap-2 overflow-hidden"
        drag="x"
        dragConstraints={{ left: -80, right: 80 }}
        dragElastic={0.2}
        whileTap={{ cursor: "grabbing" }}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="relative flex-1">
              <motion.div
                className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-medium text-slate-300"
                whileTap={{ scale: 0.94 }}
              >
                <div className="relative">
                  {active && (
                    <motion.span
                      layoutId="dock-active"
                      className="absolute -inset-2 rounded-full bg-emerald-400/20"
                      transition={{ type: "spring", stiffness: 280, damping: 22 }}
                    />
                  )}
                  <span
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full ${
                      active ? "bg-emerald-400 text-emerald-950" : "bg-white/10 text-slate-200"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <span className={active ? "text-emerald-200" : "text-slate-400"}>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
