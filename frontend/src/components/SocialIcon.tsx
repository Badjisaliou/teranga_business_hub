import type { ReactNode } from "react";

type SocialIconProps = { network: string; className?: string };

export default function SocialIcon({ network, className = "h-5 w-5" }: SocialIconProps) {
  const paths: Record<string, ReactNode> = {
    facebook: <path d="M13.5 22v-9h3l.5-3.5h-3.5V7.3c0-1 .3-1.7 1.8-1.7H17V2.5c-.7-.1-1.5-.2-2.3-.2-2.4 0-4.1 1.5-4.1 4.2v3H8v3.5h2.6v9h2.9Z" />,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="17.4" cy="6.7" r="1.1" /></>,
    linkedin: <path d="M5.4 8.6H2V22h3.4V8.6ZM3.7 2A2 2 0 1 0 3.7 6a2 2 0 0 0 0-4ZM22 14.3c0-4-2.1-5.9-5-5.9-2.3 0-3.4 1.3-4 2.2v-2H9.7V22H13v-6.6c0-1.7.3-3.4 2.5-3.4 2.1 0 2.2 2 2.2 3.5V22H22v-7.7Z" />,
    tiktok: <path d="M16.7 2c.4 2.5 1.8 4 4.3 4.2v3.3a8 8 0 0 1-4.3-1.3v7.1a6.7 6.7 0 1 1-5.8-6.6v3.5a3.3 3.3 0 1 0 2.4 3.1V2h3.4Z" />,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">{paths[network]}</svg>;
}
