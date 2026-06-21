import { ShieldX } from "lucide-react";
import { NoIndex } from "@/components/NoIndex";

export default function BannedPage() {
  return (
    <>
      <NoIndex />
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center max-w-md space-y-4">
        <ShieldX className="h-16 w-16 text-destructive mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
        <p className="text-muted-foreground">
          Sua conta foi suspensa por violação dos termos de segurança.
        </p>
        <p className="text-xs text-muted-foreground">
          Se acredita que isso é um erro, entre em contato com o suporte.
        </p>
      </div>
    </div>
    </>
  );
}
