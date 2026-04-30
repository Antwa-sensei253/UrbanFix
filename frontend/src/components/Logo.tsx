import { MapPin } from "lucide-react";
import { useT } from "@/lib/i18n";

export function Logo({ className = "" }: { className?: string }) {
  const t = useT();
  return (
    <div className={`flex items-center gap-3 group cursor-pointer ${className}`}>
      <div className="relative flex h-10 w-10 items-center justify-center">
        {/* Background Decorative Shape */}
        <div className="absolute inset-0 bg-blue-600/10 dark:bg-blue-400/10 rounded-full scale-0 group-hover:scale-110 transition-transform duration-500 ease-out" />
        
        {/* Premium SVG Mark */}
        <svg viewBox="0 0 100 100" className="h-9 w-9 relative z-10 transition-transform duration-300 group-hover:-translate-y-0.5">
          {/* Outer Ring */}
          <path 
            d="M50 5 L95 27.5 V72.5 L50 95 L5 72.5 V27.5 L50 5 Z" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            className="text-slate-200 dark:text-slate-800"
          />
          {/* Main Icon Shape - Stylized 'U' that looks like architecture */}
          <path 
            d="M30 35 V65 Q30 75 40 75 H60 Q70 75 70 65 V35" 
            fill="none" 
            stroke="url(#logo-gradient)" 
            strokeWidth="10" 
            strokeLinecap="round"
          />
          {/* Inner Accent - Horizontal bars representing steps/resolution */}
          <path d="M45 50 H55" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-teal-500" />
          <path d="M40 60 H60" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="text-blue-500" />
          
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563eb" /> {/* blue-600 */}
              <stop offset="100%" stopColor="#0d9488" /> {/* teal-600 */}
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex flex-col -space-y-1">
        <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center">
          URBAN<span className="text-blue-600 dark:text-blue-400">FIX</span>
        </span>
        <span className="text-[10px] font-bold tracking-[0.25em] text-slate-400 dark:text-slate-500 uppercase">
          {t.app_name || "Community Safety"}
        </span>
      </div>
    </div>
  );
}
