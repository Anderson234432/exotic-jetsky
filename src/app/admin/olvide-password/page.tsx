"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function OlvidePasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/auth/confirmar`,
    });

    setLoading(false);
    setEnviado(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold">
            Exotic <span className="text-brand-accent">Jetsky</span>
          </h1>
          <p className="text-sm text-muted-foreground">Recuperar contraseña</p>
        </CardHeader>
        <CardContent>
          {enviado ? (
            <p className="text-center text-sm text-slate-700">
              Si el correo existe, te enviamos un enlace para restablecer tu contraseña.
              Revisa tu bandeja de entrada.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-11 bg-brand hover:bg-brand/90 text-brand-foreground"
              >
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </Button>
              <Link href="/admin/login" className="text-center text-sm text-brand underline">
                Volver a iniciar sesión
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
