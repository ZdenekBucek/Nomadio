"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

import { signInWithGoogle } from "./actions";

export function GoogleSignInButton({ nextPath }: { nextPath: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={nextPath} />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="min-h-12 h-auto w-full rounded-xl px-4 py-3 text-center"
      disabled={pending}
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <GoogleIcon />}
      {pending ? "Přihlašuji…" : "Pokračovat přes Google"}
    </Button>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path fill="#4285F4" d="M21.35 12.18c0-.71-.06-1.4-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.52h3.15c1.84-1.7 2.9-4.2 2.9-7.29Z" />
      <path fill="#34A853" d="M12 21.67c2.62 0 4.82-.87 6.43-2.36l-3.15-2.52c-.87.59-1.98.94-3.28.94-2.52 0-4.66-1.7-5.42-3.99H3.32v2.6A9.72 9.72 0 0 0 12 21.67Z" />
      <path fill="#FBBC05" d="M6.58 13.74A5.82 5.82 0 0 1 6.27 12c0-.6.1-1.18.31-1.74v-2.6H3.32A9.66 9.66 0 0 0 2.3 12c0 1.56.37 3.04 1.02 4.34l3.26-2.6Z" />
      <path fill="#EA4335" d="M12 6.27c1.42 0 2.69.49 3.69 1.45l2.76-2.76C16.81 3.43 14.62 2.33 12 2.33a9.72 9.72 0 0 0-8.68 5.33l3.26 2.6c.76-2.29 2.9-3.99 5.42-3.99Z" />
    </svg>
  );
}
