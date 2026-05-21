'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

/**
 * Página de callback SSO — processa o retorno do Google/Apple OAuth
 * O Clerk redireciona aqui após autenticação social e cria a sessão automaticamente.
 */
export default function SSOCallbackPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-xs font-black tracking-widest uppercase animate-pulse">
          Autenticando...
        </p>
      </div>
      <AuthenticateWithRedirectCallback />
    </div>
  );
}
