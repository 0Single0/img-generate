"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Locale } from "@/lib/i18n/routing";

type UserMenuProps = {
  locale: Locale;
  user: {
    email: string;
    name: string | null;
  };
  logoutLabel: string;
};

export const UserMenu = ({ locale, user, logoutLabel }: UserMenuProps) => {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const displayName = useMemo(() => {
    if (user.name?.trim()) {
      return user.name.trim();
    }

    return user.email.split("@")[0] || user.email || "User";
  }, [user.email, user.name]);

  const handleToggle = useCallback(() => {
    setIsOpen((current) => !current);
  }, []);

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace(`/${locale}/login`);
    router.refresh();
  }, [locale, router]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        className="flex h-11 items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-[#f2f0ff]"
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={handleToggle}
      >
        <span className="flex size-[clamp(34px,2vw,42px)] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_28%,#dcd7ff_0_23%,#a493ef_24%_100%)]">
          <span className="mt-5 size-8 rounded-full bg-[#f4efff]/85" />
        </span>
        <span className="hidden max-w-[160px] flex-col leading-tight sm:flex">
          <span className="truncate text-[clamp(13px,0.72vw,15px)] font-semibold text-[#202a50]">
            {displayName}
          </span>
          <span className="truncate text-xs font-medium text-[#7b84a6]">{user.email}</span>
        </span>
        <ChevronDown
          className="hidden size-4 shrink-0 text-[#7580a0] transition-transform sm:block"
          data-open={isOpen}
          strokeWidth={2.2}
        />
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(260px,calc(100vw-32px))] rounded-lg border border-[#e3e7f1] bg-white p-2 shadow-[0_20px_50px_rgba(36,45,91,0.16)]"
          role="menu"
        >
          <div className="border-b border-[#eef1f7] px-3 py-2">
            <p className="truncate text-sm font-semibold text-[#202a50]">{displayName}</p>
            <p className="mt-0.5 truncate text-xs font-medium text-[#7b84a6]">{user.email}</p>
          </div>
          <button
            className="mt-2 flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm font-semibold text-[#b42318] transition-colors hover:bg-[#fff1ef]"
            type="button"
            role="menuitem"
            onClick={handleLogout}
          >
            <LogOut className="size-4" strokeWidth={2} />
            {logoutLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
};
