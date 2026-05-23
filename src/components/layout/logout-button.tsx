"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type LogoutButtonProps = {
  label: string;
};

export const LogoutButton = ({ label }: LogoutButtonProps) => {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/zh/login");
    router.refresh();
  };

  return (
    <Button variant="ghost" onClick={handleLogout} className="justify-start">
      <LogOut className="size-4" />
      {label}
    </Button>
  );
};

