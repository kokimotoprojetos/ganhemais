import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GanheMais - Sua Plataforma de Tarefas',
  description: 'Ganhe dinheiro completando tarefas simples e check-ins diários.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <html lang="pt-BR">
        <body className={inter.className} suppressHydrationWarning>
          <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 text-center relative overflow-hidden">
            {/* Decorative background glow */}
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-red-500/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-md w-full bg-slate-900/60 border border-red-500/20 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center border-b-4 border-b-red-500 z-10">
              <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Chaves do Clerk Ausentes</h2>
              <p className="text-slate-400 text-xs font-semibold leading-relaxed mb-6">
                O site foi configurado para usar o **Clerk** como sistema de login, mas as credenciais não foram configuradas no ambiente de produção da sua hospedagem (Vercel).
              </p>
              
              <div className="w-full text-left bg-slate-950/60 p-5 rounded-2xl font-mono text-[11px] text-slate-300 space-y-3 border border-slate-800 leading-normal">
                <p className="font-bold text-white"><span className="text-red-400">Como resolver no Vercel:</span></p>
                <p><span className="text-emerald-400 font-bold">1.</span> Acesse o painel da **Vercel**.</p>
                <p><span className="text-emerald-400 font-bold">2.</span> Vá em **Settings** &gt; **Environment Variables**.</p>
                <p><span className="text-emerald-400 font-bold">3.</span> Adicione as chaves:</p>
                <p className="pl-4 text-white"><code>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code></p>
                <p className="pl-4 text-white"><code>CLERK_SECRET_KEY</code></p>
                <p><span className="text-emerald-400 font-bold">4.</span> Faça um novo **Deploy** para aplicar.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="pt-BR">
        <body className={inter.className} suppressHydrationWarning>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
