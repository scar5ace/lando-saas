"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" disabled={pending} onClick={signOut}>
      <LogOut className="size-4" aria-hidden="true" />
      {pending ? "Выходим…" : "Выйти"}
    </Button>
  );
}
