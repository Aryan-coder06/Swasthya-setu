"use client";
import React, { useEffect, useState } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "motion/react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type NavItem = {
  name: string;
  link: string;
  icon?: React.ReactNode;
};

export const FloatingNav = ({
  navItems,
  className,
  activeSection,
  brand,
  login,
  cta,
  showAtTop = false,
}: {
  navItems: NavItem[];
  className?: string;
  activeSection?: string;
  brand?: {
    name: string;
    href?: string;
    icon?: React.ReactNode;
    accentClassName?: string;
  };
  login?: {
    label: string;
    href: string;
  };
  cta?: {
    label: string;
    href: string;
  };
  showAtTop?: boolean;
}) => {
  const { scrollYProgress } = useScroll();

  const [visible, setVisible] = useState(showAtTop);

  useEffect(() => {
    if (showAtTop) {
      setVisible(true);
    }
  }, [showAtTop]);

  useMotionValueEvent(scrollYProgress, "change", (current) => {
    // Check if current is not undefined and is a number
    if (typeof current === "number") {
      let direction = current! - scrollYProgress.getPrevious()!;

      if (scrollYProgress.get() < 0.05) {
        setVisible(showAtTop);
      } else {
        if (direction < 0) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      }
    }
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{
          opacity: 1,
          y: -100,
        }}
        animate={{
          y: visible ? 0 : -100,
          opacity: visible ? 1 : 0,
        }}
        transition={{
          duration: 0.2,
        }}
        className={cn(
          "fixed top-6 inset-x-0 mx-auto z-[5000] w-[min(100%,60rem)] px-4",
          className
        )}
      >
        <div className="flex items-center justify-between gap-3 rounded-full border border-white/60 bg-white/85 px-5 py-3 shadow-lg shadow-cyan-500/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            {brand ? (
              <Link
                href={brand.href ?? "#"}
                className="flex items-center gap-2 rounded-full pr-3 transition hover:opacity-90"
              >
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-md shadow-emerald-500/40",
                    brand.accentClassName
                  )}
                >
                  {brand.icon}
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-white">
                  {brand.name}
                </span>
              </Link>
            ) : null}
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((navItem, idx) => {
              const target = navItem.link.startsWith("#")
                ? navItem.link.slice(1)
                : navItem.link;
              const isActive =
                !!activeSection && target.toLowerCase() === activeSection;

              return (
                <Link
                  key={`floating-nav-link-${idx}`}
                  href={navItem.link}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-cyan-50 text-cyan-700 shadow-sm shadow-cyan-500/30"
                      : "text-slate-600 hover:text-cyan-600"
                  )}
                >
                  {navItem.icon ? (
                    <span className="text-base opacity-80">{navItem.icon}</span>
                  ) : null}
                  <span>{navItem.name}</span>
                  {isActive ? (
                    <motion.span
                      layoutId="floating-nav-active-pill"
                      className="absolute inset-0 rounded-full border border-cyan-200/60"
                    />
                  ) : null}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex md:hidden items-center gap-2">
              {navItems.slice(0, 3).map((item, idx) => {
                const target = item.link.startsWith("#")
                  ? item.link.slice(1)
                  : item.link;
                const isActive =
                  !!activeSection && target.toLowerCase() === activeSection;
                return (
                  <Link
                    key={`floating-nav-mobile-${idx}`}
                    href={item.link}
                    aria-label={item.name}
                    className={cn(
                      "grid h-10 w-10 place-items-center rounded-full border border-transparent text-slate-600 transition",
                      isActive
                        ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                        : "hover:bg-slate-100"
                    )}
                  >
                    {item.icon}
                  </Link>
                );
              })}
            </div>

            {login ? (
              <Button
                asChild
                variant="ghost"
                className="hidden h-10 px-4 text-sm font-medium text-slate-600 hover:text-cyan-600 md:inline-flex"
              >
                <Link href={login.href}>{login.label}</Link>
              </Button>
            ) : null}
            {cta ? (
              <Button
                asChild
                className="h-10 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 hover:opacity-95"
              >
                <Link href={cta.href}>{cta.label}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
