import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  FileSpreadsheet,
  Network,
  MessageSquareText,
  UploadCloud,
  ArrowRight,
  Sparkles,
  Layers,
  Database,
  Cpu,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { StatCard } from "../components/StatCard.tsx";
import { FileUploadModal } from "../components/FileUploadModal.tsx";
import { useWorkspace } from "../context/WorkspaceContext.tsx";
import { api } from "../services/api.ts";
import { ResearchDocument, SynthesisReport } from "../types/index.ts";

export const Dashboard: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const [stats, setStats] = useState<any>({
    totalDocuments: 0,
    completedDocuments: 0,
    totalSyntheses: 0,
    totalChatSessions: 0,
  });
  const [recentDocs, setRecentDocs] = useState<ResearchDocument[]>([]);
  const [recentSyntheses, setRecentSyntheses] = useState<SynthesisReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const navigate = useNavigate();

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.workspaces.getDashboardStats();
      setStats(res.metrics);
      setRecentDocs(res.recentDocs || []);
      setRecentSyntheses(res.recentSyntheses || []);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeWorkspace]);

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 p-6 md:p-8 shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md mb-3">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Intelligent Academic & Corporate Research Synthesis Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {activeWorkspace ? activeWorkspace.name : "OmniResearch Knowledge Discovery"}
          </h1>
          <p className="mt-2 text-xs md:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Ingest multi-modal preprints, PDFs, and CSV datasets. Extract structured research
            metadata, generate comparative literature matrices, and discover entity relationships with
            strict source attribution.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 hover:shadow-indigo-600/35"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Ingest New Document</span>
            </button>
            <Link
              to="/synthesis"
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-850"
            >
              <FileSpreadsheet className="h-4 w-4 text-indigo-400" />
              <span>Launch Multi-Doc Synthesis</span>
            </Link>
            <Link
              to="/knowledge-graph"
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-850"
            >
              <Network className="h-4 w-4 text-cyan-400" />
              <span>Explore Knowledge Graph</span>
            </Link>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ingested Papers"
          value={stats.totalDocuments}
          subtitle={`${stats.completedDocuments} vectorized & indexed`}
          icon={FileText}
          accentColor="indigo"
          badge="Corpus Ready"
        />
        <StatCard
          title="Synthesis Jobs"
          value={stats.totalSyntheses}
          subtitle="Comparative matrices generated"
          icon={FileSpreadsheet}
          accentColor="cyan"
          badge="Structured JSON"
        />
        <StatCard
          title="Contextual Queries"
          value={stats.totalChatSessions}
          subtitle="RAG conversations initiated"
          icon={MessageSquareText}
          accentColor="purple"
          badge="Cited Grounding"
        />
        <StatCard
          title="Semantic Graph Nodes"
          value={stats.totalDocuments > 0 ? stats.totalDocuments * 4 + 6 : 0}
          subtitle="Topics, methodologies, datasets"
          icon={Network}
          accentColor="emerald"
          badge="Real-time Network"
        />
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Ingested Documents (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Recent Ingested Literature
              </h2>
            </div>
            <Link
              to="/documents"
              className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              <span>View All Papers</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900/50 shadow-md backdrop-blur-sm overflow-hidden">
            {recentDocs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No documents found in this workspace. Upload your first research paper to begin.
              </div>
            ) : (
              recentDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => navigate(`/documents/${doc.id}`)}
                  className="flex items-center justify-between p-4 transition hover:bg-slate-800/40 cursor-pointer"
                >
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 uppercase">
                        {doc.file_type.includes("pdf") ? "PDF" : doc.file_type.includes("csv") ? "CSV" : "DOC"}
                      </span>
                      <h4 className="font-semibold text-xs text-slate-100 hover:text-indigo-300 transition truncate">
                        {doc.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {doc.summary || "Parsed research extract ready for multi-document synthesis."}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                      {(doc.file_size_bytes / (1024 * 1024)).toFixed(1)} MB
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Ready</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Recent Synthesis Reports & Quick Action (1/3 width) */}
        <div className="space-y-6">
          {/* Quick Synthesis Preview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Active Synthesis Reports
                </h2>
              </div>
              <Link
                to="/synthesis"
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300"
              >
                Open Studio
              </Link>
            </div>

            <div className="space-y-3">
              {recentSyntheses.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center text-xs text-slate-400">
                  No synthesis jobs run yet. Select papers in the Document Vault to compare methodologies.
                </div>
              ) : (
                recentSyntheses.map((rep) => (
                  <Link
                    key={rep.id}
                    to="/synthesis"
                    className="block rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700 hover:bg-slate-900"
                  >
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-500/20">
                        {rep.report_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(rep.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="mt-2 text-xs font-semibold text-slate-100 line-clamp-2">
                      {rep.title}
                    </h4>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {rep.document_ids ? rep.document_ids.length : 0} documents synthesized
                    </p>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* AI Workflow Card */}
          <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/30 to-slate-900 p-5 shadow-lg">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Automated Synthesis Pipeline
              </h3>
            </div>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              Ingested papers automatically parse through Gemini 3.8 Flash to extract methodologies,
              hypotheses, key findings, and citations into strict schema-validated records.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <Link
                to="/chat"
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
              >
                <span>Launch RAG Assistant</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => loadDashboardData()}
      />
    </div>
  );
};
