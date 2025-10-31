// src/components/auth/RoleGate.tsx
import { getRole, Role } from "../../lib/auth";
import { Lock } from "lucide-react";
import React from "react";

type RoleGateProps = {
  allowed: Role[];
  children: React.ReactNode;
};

export default function RoleGate({ allowed, children }: RoleGateProps) {
  const role = getRole();

  // Se o papel atual tiver permissão → mostra o conteúdo normalmente
  if (role && allowed.includes(role)) {
    return <>{children}</>;
  }

  // Caso contrário, mostra o bloqueio visual
  return (
    <div className="relative flex items-center justify-center h-full w-full">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
        <div className="text-center text-white">
          <Lock size={48} className="mx-auto mb-2 opacity-80" />
          <p className="text-lg font-semibold">Acesso restrito</p>
          <p className="text-sm text-slate-300">
            Você não tem permissão para visualizar esta página.
          </p>
        </div>
      </div>
      {/* o conteúdo ainda é renderizado no fundo */}
      <div className="opacity-40 pointer-events-none">{children}</div>
    </div>
  );
}
