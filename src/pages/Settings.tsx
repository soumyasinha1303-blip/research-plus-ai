import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Cpu,
  Database,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Shield,
  Server,
  User,
  Plus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { useWorkspace } from "../context/WorkspaceContext.tsx";
import { api } from "../services/api.ts";

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace, createWorkspace } = useWorkspace();
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Workspace form state
  const [newWsName, setNewWsName] = useState("");
  const [newWsDomain, setNewWsDomain] = useState("Computer Science & AI Research");
  const [newWsDesc, setNewWsDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatus() {
      try {
        setLoading(true);
        const res = await api.system.status();
        setSystemStatus(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;
    try {
      setCreating(true);
      await createWorkspace(newWsName, newWsDesc, newWsDomain);
      setNewWsName("");
      setNewWsDesc("");
      setSuccessMsg("Research workspace created successfully.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert("Error creating workspace: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
          <SettingsIcon className="h-6 w-6 text-indigo-400" />
          <span>System Settings & Architecture</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Platform status, server-side Gemini 3.8 model connectivity, and workspace isolation configuration.
        </p>
      </div>

      {/* AI Engine & System Status Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              AI Engine & Compute Gateway
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Operational
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Primary Model Engine
            </p>
            <h4 className="mt-1 font-mono text-sm font-bold text-slate-100">
              {systemStatus?.engine || "Gemini 3.8 Flash"}
            </h4>
            <p className="mt-1 text-[11px] text-slate-400">
              Server-side official SDK with structured JSON response schema enforcement
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Key Availability
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <h4 className="font-mono text-sm font-bold text-slate-100">
                {systemStatus?.hasApiKey ? "Attached via AI Studio Secrets" : "Simulated Local Pipeline"}
              </h4>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Accessed strictly on backend; never exposed to browser client
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Database Persistence
            </p>
            <h4 className="mt-1 font-mono text-sm font-bold text-slate-100">
              PostgreSQL / SQLite WAL Engine
            </h4>
            <p className="mt-1 text-[11px] text-slate-400">
              Multi-tenant data isolation with user_id query bounds
            </p>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <User className="h-4 w-4 text-indigo-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">
            Authenticated Researcher Identity
          </h3>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 font-extrabold text-white text-base shadow-lg">
            {user?.fullName?.charAt(0) || "U"}
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">{user?.fullName}</h4>
            <p className="text-xs text-slate-400 font-mono">{user?.email}</p>
            <p className="mt-0.5 text-[10px] text-indigo-400">
              Principal Research Investigator • User ID: {user?.id}
            </p>
          </div>
        </div>
      </div>

      {/* Workspaces Management */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Research Workspaces ({workspaces.length})
            </h3>
          </div>
        </div>

        {/* Existing workspaces list */}
        <div className="space-y-2">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className={`flex items-center justify-between rounded-xl border p-3.5 transition ${
                activeWorkspace?.id === ws.id
                  ? "border-indigo-500 bg-indigo-950/20"
                  : "border-slate-800 bg-slate-950/60"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-xs text-slate-100">{ws.name}</h4>
                  {activeWorkspace?.id === ws.id && (
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-bold text-indigo-300">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{ws.domain}</p>
              </div>

              {activeWorkspace?.id !== ws.id && (
                <button
                  onClick={() => setActiveWorkspace(ws)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                >
                  Switch to this
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Create new workspace form */}
        <form onSubmit={handleCreate} className="border-t border-slate-800 pt-5 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Create Additional Workspace
          </h4>

          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-medium text-slate-400">Workspace Title</label>
              <input
                type="text"
                required
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                placeholder="e.g. Econometric Volatility Under Macro Shifts"
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-400">Domain Classification</label>
              <select
                value={newWsDomain}
                onChange={(e) => setNewWsDomain(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="Biomedical & Clinical Life Sciences">Biomedical & Clinical Life Sciences</option>
                <option value="Computer Science & AI Research">Computer Science & AI Research</option>
                <option value="Economics & Quantitative Finance">Economics & Quantitative Finance</option>
                <option value="Legal, Policy & Compliance">Legal, Policy & Compliance</option>
                <option value="General Interdisciplinary Academic">General Interdisciplinary Academic</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={creating || !newWsName.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{creating ? "Creating..." : "Create Workspace"}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
