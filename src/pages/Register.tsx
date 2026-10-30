import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, AlertCircle, Lock, Mail, User } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";

export const Register: React.FC = () => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      await register(email, password, fullName);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to register account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 shadow-xl shadow-indigo-600/25">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-white">OmniResearch AI</h2>
          <p className="mt-1 text-xs text-slate-400">
            Create an isolated multi-tenant research workspace
          </p>
        </div>

        {/* Register Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Register Investigator
            </h3>
            <span className="text-[11px] text-slate-400">Isolated Workspace</span>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Full Name & Title
              </label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Jordan Hayes"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Email Address
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jhayes@institution.edu"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? "Creating Workspace..." : "Create Research Account"}
            </button>
          </form>

          <div className="mt-5 border-t border-slate-800 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
