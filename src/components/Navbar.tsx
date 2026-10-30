import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Layers,
  Sparkles,
  Plus,
  LogOut,
  ChevronDown,
  User as UserIcon,
  Cpu,
  Search,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { useWorkspace } from "../context/WorkspaceContext.tsx";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace, createWorkspace } = useWorkspace();
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);

  // New workspace form state
  const [wsName, setWsName] = useState("");
  const [wsDescription, setWsDescription] = useState("");
  const [wsDomain, setWsDomain] = useState("Computer Science & AI Research");
  const [creating, setCreating] = useState(false);

  const navigate = useNavigate();

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;
    try {
      setCreating(true);
      await createWorkspace(wsName, wsDescription, wsDomain);
      setShowNewWorkspaceModal(false);
      setWsName("");
      setWsDescription("");
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 md:px-6 backdrop-blur-md">
        {/* Brand & Workspace Switcher */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-extrabold tracking-tight text-white">OmniResearch</span>
              <span className="ml-1 text-xs font-semibold uppercase tracking-wider text-indigo-400">AI</span>
            </div>
          </Link>

          <div className="h-5 w-px bg-slate-800 hidden md:block"></div>

          {/* Workspace Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-700 hover:bg-slate-850"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              <span className="max-w-[140px] truncate md:max-w-[200px]">
                {activeWorkspace ? activeWorkspace.name : "Select Workspace"}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {showWorkspaceMenu && (
              <div
                className="absolute left-0 mt-2 w-72 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-xl backdrop-blur-xl z-50 animate-in fade-in slide-in-from-top-2"
                onClick={() => setShowWorkspaceMenu(false)}
              >
                <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Research Workspaces
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => setActiveWorkspace(ws)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                        activeWorkspace?.id === ws.id
                          ? "bg-indigo-600/20 text-indigo-300 font-semibold"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="truncate">
                        <p className="truncate font-medium">{ws.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{ws.domain}</p>
                      </div>
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400">
                        {ws.document_count || 0} docs
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-1 border-t border-slate-800 pt-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowWorkspaceMenu(false);
                      setShowNewWorkspaceModal(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-indigo-400 hover:bg-indigo-950/40"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create New Workspace
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Stats / Search & Model Badge */}
        <div className="flex items-center gap-3">
          {/* AI Engine Status Badge */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <Cpu className="h-3.5 w-3.5 animate-pulse" />
            <span>Gemini 3.8 Flash Active</span>
          </div>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 p-1 pr-3 text-xs font-medium text-slate-200 transition hover:border-slate-700"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-[11px] font-bold text-white shadow">
                {user?.fullName?.charAt(0) || "U"}
              </div>
              <span className="hidden md:inline max-w-[120px] truncate">{user?.fullName || "Researcher"}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2"
                onClick={() => setShowProfileMenu(false)}
              >
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
                <div className="p-1">
                  <Link
                    to="/settings"
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                    Account & Preferences
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-rose-400 hover:bg-rose-950/30"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* New Workspace Modal */}
      {showNewWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Create Research Workspace</h3>
            <p className="mt-1 text-xs text-slate-400">
              Workspaces isolate ingested papers, synthesis jobs, and knowledge graph indexes.
            </p>

            <form onSubmit={handleCreateWorkspace} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300">Workspace Name</label>
                <input
                  type="text"
                  required
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  placeholder="e.g. mRNA Oncology & Genomic Targets"
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Research Domain</label>
                <select
                  value={wsDomain}
                  onChange={(e) => setWsDomain(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="Biomedical & Clinical Life Sciences">Biomedical & Clinical Life Sciences</option>
                  <option value="Computer Science & AI Research">Computer Science & AI Research</option>
                  <option value="Economics & Quantitative Finance">Economics & Quantitative Finance</option>
                  <option value="Legal, Policy & Compliance">Legal, Policy & Compliance</option>
                  <option value="General Interdisciplinary Academic">General Interdisciplinary Academic</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Description (Optional)</label>
                <textarea
                  value={wsDescription}
                  onChange={(e) => setWsDescription(e.target.value)}
                  rows={2}
                  placeholder="Focus areas, study goals, or corpus notes..."
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewWorkspaceModal(false)}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
