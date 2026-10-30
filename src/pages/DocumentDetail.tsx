import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FileText,
  ArrowLeft,
  Sparkles,
  Database,
  BookOpen,
  AlertTriangle,
  Layers,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Calendar,
  Cpu,
} from "lucide-react";
import { api } from "../services/api.ts";
import { ResearchDocument } from "../types/index.ts";

export const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<ResearchDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"findings" | "methodology" | "limitations" | "citations" | "raw">("findings");
  const [reprocessing, setReprocessing] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  const navigate = useNavigate();

  const loadDocument = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.documents.getById(id);
      setDocument(res.document);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocument();
  }, [id]);

  const handleReprocess = async () => {
    if (!id) return;
    try {
      setReprocessing(true);
      await api.documents.process(id);
      await loadDocument();
    } catch (err: any) {
      alert("Extraction failed: " + err.message);
    } finally {
      setReprocessing(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm("Delete this document and all extracted entities?")) return;
    try {
      await api.documents.delete(id);
      navigate("/documents");
    } catch (err: any) {
      alert("Failed to delete document: " + err.message);
    }
  };

  const handleCopyRaw = () => {
    if (!document?.raw_content) return;
    navigator.clipboard.writeText(document.raw_content);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center p-8">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
          <span className="text-sm font-medium">Loading document metadata & extracted entities...</span>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-8 text-center">
        <h3 className="text-base font-bold text-white">Document not found</h3>
        <Link to="/documents" className="mt-2 inline-flex items-center gap-1 text-xs text-indigo-400">
          <ArrowLeft className="h-3.5 w-3.5" /> Return to Document Vault
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 md:p-8 max-w-6xl mx-auto">
      {/* Back button & Actions */}
      <div className="flex items-center justify-between">
        <Link
          to="/documents"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Document Vault</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleReprocess}
            disabled={reprocessing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${reprocessing ? "animate-spin text-indigo-400" : ""}`} />
            <span>{reprocessing ? "Extracting..." : "Re-run Gemini Extraction"}</span>
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-1.5 text-rose-400 hover:bg-rose-500/20 transition"
            title="Delete Document"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Document Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 md:p-8 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 uppercase tracking-wider border border-indigo-500/20">
            {document.file_type.includes("pdf") ? "PDF Paper" : document.file_type.includes("csv") ? "CSV Dataset" : "Markdown"}
          </span>
          {document.primary_topic && (
            <span className="rounded-md bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-300 border border-slate-700">
              {document.primary_topic}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 ml-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            {document.status}
          </span>
        </div>

        <h1 className="mt-4 text-xl md:text-2xl font-extrabold text-white leading-snug">
          {document.title}
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            <span>{document.file_name}</span>
          </div>
          <span>•</span>
          <div>{(document.file_size_bytes / (1024 * 1024)).toFixed(2)} MB</div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>Ingested {new Date(document.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {document.summary && (
          <div className="mt-5 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              Executive Abstract Summary
            </h4>
            <p className="mt-2 text-xs text-slate-200 leading-relaxed font-sans">
              {document.summary}
            </p>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-6">
        {[
          { key: "findings", label: "Key Findings" },
          { key: "methodology", label: "Methodology & Architecture" },
          { key: "limitations", label: "Limitations & Constraints" },
          { key: "citations", label: "Datasets & Citations" },
          { key: "raw", label: "Raw Document Stream" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`py-3 text-xs font-semibold uppercase tracking-wider transition border-b-2 ${
              activeTab === tab.key
                ? "border-indigo-500 text-indigo-400 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-md backdrop-blur-sm">
        {/* Key Findings */}
        {activeTab === "findings" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Extracted Empirical Findings
            </h3>
            {document.key_findings && document.key_findings.length > 0 ? (
              <ul className="space-y-3">
                {document.key_findings.map((finding, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-200 leading-relaxed"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-300">
                      {idx + 1}
                    </span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">No empirical findings extracted.</p>
            )}
          </div>
        )}

        {/* Methodology */}
        {activeTab === "methodology" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="h-4 w-4 text-cyan-400" />
              Methodology & Technical Formulation
            </h3>
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 text-xs text-slate-200 leading-relaxed">
              <p className="whitespace-pre-wrap">
                {document.methodology || "Standard empirical investigation methodology."}
              </p>
            </div>
          </div>
        )}

        {/* Limitations */}
        {activeTab === "limitations" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Reported Limitations & Threats to Validity
            </h3>
            {document.limitations && document.limitations.length > 0 ? (
              <ul className="space-y-3">
                {document.limitations.map((lim, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-950/10 p-4 text-xs text-slate-200 leading-relaxed"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300">
                      {idx + 1}
                    </span>
                    <span>{lim}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">No specific limitations documented.</p>
            )}
          </div>
        )}

        {/* Datasets & Citations */}
        {activeTab === "citations" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-emerald-400" />
                Datasets & Corpora Utilized
              </h4>
              {document.datasets_used && document.datasets_used.length > 0 ? (
                <div className="space-y-2">
                  {document.datasets_used.map((ds, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-emerald-300"
                    >
                      {ds}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No explicit datasets referenced.</p>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                Referenced Academic Citations
              </h4>
              {document.citations_referenced && document.citations_referenced.length > 0 ? (
                <div className="space-y-2">
                  {document.citations_referenced.map((cit, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300 font-mono"
                    >
                      {cit}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No citations listed.</p>
              )}
            </div>
          </div>
        )}

        {/* Raw Content */}
        {activeTab === "raw" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Raw Extracted Text Stream
              </h4>
              <button
                onClick={handleCopyRaw}
                className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
              >
                {copiedRaw ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedRaw ? "Copied" : "Copy Raw Text"}</span>
              </button>
            </div>
            <pre className="h-96 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {document.raw_content || "No raw text available."}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
