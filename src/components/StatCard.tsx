import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  accentColor?: "indigo" | "cyan" | "emerald" | "amber" | "purple";
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  accentColor = "indigo",
}) => {
  const colorMap = {
    indigo: "from-indigo-500/15 via-indigo-500/5 to-transparent text-indigo-400 border-indigo-500/20",
    cyan: "from-cyan-500/15 via-cyan-500/5 to-transparent text-cyan-400 border-cyan-500/20",
    emerald: "from-emerald-500/15 via-emerald-500/5 to-transparent text-emerald-400 border-emerald-500/20",
    amber: "from-amber-500/15 via-amber-500/5 to-transparent text-amber-400 border-amber-500/20",
    purple: "from-purple-500/15 via-purple-500/5 to-transparent text-purple-400 border-purple-500/20",
  };

  const iconBgMap = {
    indigo: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    purple: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-b ${colorMap[accentColor]} p-5 shadow-sm backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-400">{title}</p>
          <h3 className="mt-2 font-mono text-3xl font-bold tracking-tight text-white">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={`rounded-lg p-2.5 ${iconBgMap[accentColor]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {badge && (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-900/60 px-2 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700/50">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          {badge}
        </div>
      )}
    </div>
  );
};
