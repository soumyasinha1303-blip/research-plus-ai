import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, AlertCircle, Lock, Mail, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";

export const Login: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setDemoLoading(true);
    setError(null);
    try {
      await demoLogin();
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to initialize demo session.");
    } finally {
      setDemoLoading(false);
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
            Intelligent Academic & Corporate Research Synthesis Engine
          </p>
        </div>

        {/* Demo Fast Login Banner */}
        <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 p-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Instant Researcher Evaluation
            </h4>
          </div>
          <p className="mt-1 text-xs text-slate-300">
            Pre-loaded with 4 peer-reviewed AI & systems papers, comparative matrix synthesis, and knowledge graph.
          </p>
          <button
            onClick={handleDemo}
            disabled={demoLoading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition hover:bg-indigo-500 disabled:opacity-50"
          >
            <span>{demoLoading ? "Authenticating Demo..." : "Enter with Demo Researcher Account"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Standard Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Account Sign In
            </h3>
            <span className="text-[11px] text-slate-400">JWT Protected</span>
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
                Email Address
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="researcher@university.edu"
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
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-slate-800 py-2.5 text-xs font-semibold text-slate-100 transition hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In to Workspace"}
            </button>
          </form>

          <div className="mt-5 border-t border-slate-800 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Need a research account?{" "}
              <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300">
                Register New User
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
