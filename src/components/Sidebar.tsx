import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  FileSpreadsheet,
  MessageSquareText,
  Network,
  Settings,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { useWorkspace } from "../context/WorkspaceContext.tsx";

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Document Vault", path: "/documents", icon: FileText },
  { name: "Synthesis Engine", path: "/synthesis", icon: FileSpreadsheet },
  { name: "RAG Assistant", path: "/chat", icon: MessageSquareText },
  { name: "Knowledge Graph", path: "/knowledge-graph", icon: Network },
  { name: "System Settings", path: "/settings", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { activeWorkspace } = useWorkspace();

  return (
    <aside className="hidden md:flex w-64 flex-col justify-between border-r border-slate-800 bg-slate-950 p-4">
      <div className="space-y-6">
        {/* Workspace Quick Card */}
        {activeWorkspace && (
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Active Corpus
              </p>
            </div>
            <h4 className="mt-1 font-semibold text-sm text-slate-100 truncate">
              {activeWorkspace.name}
            </h4>
            <span className="mt-2 inline-block rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-slate-700/50">
              {activeWorkspace.domain}
            </span>
          </div>
        )}

        {/* Navigation links */}
        <nav className="space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Discovery Workspaces
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="rounded-xl border border-slate-800/70 bg-gradient-to-br from-indigo-950/20 to-slate-900/40 p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-200">Gemini 3.8 Reasoning</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
          Vectorized entity extraction with strict JSON schema validation and zero hallucinations.
        </p>
      </div>
    </aside>
  );
};
