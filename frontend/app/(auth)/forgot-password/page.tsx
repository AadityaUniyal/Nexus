import Link from "next/link";
import { ArrowLeft, CircleHelp } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface)] text-[var(--on-surface)]">
      <header className="border-b border-black/[0.07] dark:border-white/[0.09]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Nexus home"><LogoMark size={25} /><span className="text-[15px] font-semibold tracking-[-0.035em]">nexus</span></Link>
          <Link href="/login" className="text-[12px] text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]">Back to sign in</Link>
        </div>
      </header>
      <main id="main-content" className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <section className="w-full max-w-[420px]">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-black/[0.08] bg-white/70 dark:border-white/[0.1] dark:bg-white/[0.035]"><CircleHelp size={17} className="text-emerald-800 dark:text-emerald-300" /></span>
          <h1 className="mt-5 text-[30px] font-semibold tracking-[-0.055em]">Password recovery</h1>
          <p className="mt-2 text-[14px] leading-6 text-[var(--on-surface-variant)]">Self-serve password reset is not available for this workspace yet.</p>
          <div role="status" className="mt-6 rounded-2xl border border-amber-600/20 bg-amber-500/[0.06] p-5 text-[13px] leading-6">
            <p className="font-medium">Contact your workspace administrator</p>
            <p className="mt-1 text-[12px] text-[var(--on-surface-variant)]">They can help restore access. Nexus will add email-based recovery when a secure delivery service is configured.</p>
          </div>
          <Link href="/login" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-[#163d35] px-5 text-[12px] font-semibold text-white transition-transform hover:scale-[1.01] active:scale-[0.99] dark:bg-[#cde5d9] dark:text-[#102a24]"><ArrowLeft size={14} /> Return to sign in</Link>
        </section>
      </main>
      <footer className="border-t border-black/[0.07] px-5 py-5 text-center text-[10px] text-[var(--on-surface-variant)] dark:border-white/[0.09]">Nexus · Logistics operations workspace</footer>
    </div>
  );
}
