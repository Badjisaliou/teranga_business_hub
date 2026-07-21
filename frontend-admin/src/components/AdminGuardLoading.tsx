export default function AdminGuardLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm rounded-[1.25rem] border border-blue-100 bg-white/90 p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-[color:var(--tbh-red)]/15 ring-8 ring-[color:var(--tbh-red)]/5" />
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[color:var(--tbh-red)]">Admin</p>
        <h1 className="mt-2 text-xl font-black text-slate-950">Verification en cours</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Nous verifions votre session administrateur.</p>
      </div>
    </div>
  );
}
