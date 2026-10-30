import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  FileSpreadsheet,
  Sparkles,
  Layers,
  Settings,
  Download,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  History,
  FileText,
  Clock,
  Compass,
} from "lucide-react";
import { SynthesisMatrixTable } from "../components/SynthesisMatrixTable.tsx";
import { ExportModal } from "../components/ExportModal.tsx";
import { useWorkspace } from "../context/WorkspaceContext.tsx";
import { api } from "../services/api.ts";
import { ResearchDocument, SynthesisReport } from "../types/index.ts";

export const Synthesis: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const location = useLocation();

  const [documents, setDocuments] = useState<ResearchDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [reportType, setReportType] = useState<"LITERATURE_REVIEW" | "COMPARATIVE_MATRIX" | "GAP_ANALYSIS">("LITERATURE_REVIEW");

  // Form & Advisory Parameters (Section 9)
  const [targetAudience, setTargetAudience] = useState<"Executive" | "Peer Reviewer" | "Layman" | "Policy Maker">("Peer Reviewer");
  const [depth, setDepth] = useState<"CONCISE" | "STANDARD" | "EXHAUSTIVE">("STANDARD");
  const [tone, setTone] = useState<"Academic" | "Analytical" | "Critical" | "Prescriptive">("Analytical");
  const [citationStyle, setCitationStyle] = useState<"APA7" | "IEEE" | "HARVARD" | "BIBTEX">("APA7");

  const [generating, setGenerating] = useState(false);
  const [currentReport, setCurrentReport] = useState<SynthesisReport | null>(null);
  const [reportHistory, setReportHistory] = useState<SynthesisReport[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize selected documents from navigation state if available
  useEffect(() => {
    if (location.state && (location.state as any).selectedDocIds) {
      setSelectedDocIds((location.state as any).selectedDocIds);
    }
  }, [location.state]);

  const loadData = async () => {
    if (!activeWorkspace) return;
    try {
      const [docsRes, repsRes] = await Promise.all([
        api.documents.list(activeWorkspace.id),
        api.synthesis.listReports(activeWorkspace.id),
      ]);
      setDocuments(docsRes.documents || []);
      setReportHistory(repsRes.reports || []);

      if (repsRes.reports && repsRes.reports.length > 0 && !currentReport) {
        setCurrentReport(repsRes.reports[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeWorkspace]);

  const handleToggleDoc = (docId: string) => {
    if (selectedDocIds.includes(docId)) {
      setSelectedDocIds(selectedDocIds.filter((id) => id !== docId));
    } else {
      if (selectedDocIds.length >= 5) {
        alert("Maximum 5 documents can be compared simultaneously.");
        return;
      }
      setSelectedDocIds([...selectedDocIds, docId]);
    }
  };

  const handleGenerate = async () => {
    if (!activeWorkspace) return;
    if (selectedDocIds.length === 0) {
      setError("Please select at least 1 document to synthesize.");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await api.synthesis.generate({
        workspaceId: activeWorkspace.id,
        documentIds: selectedDocIds,
        reportType,
        formatOptions: {
          depth,
          citationStyle,
          targetAudience,
          tone,
        },
      });

      // Construct report object for immediate view
      const newReport: SynthesisReport = {
        id: res.reportId,
        workspace_id: activeWorkspace.id,
        title: res.synthesis.title,
        document_ids: selectedDocIds,
        report_type: reportType,
        content_json: res.synthesis,
        created_at: new Date().toISOString(),
      };

      setCurrentReport(newReport);
      setReportHistory((prev) => [newReport, ...prev]);
    } catch (err: any) {
      setError(err.message || "Failed to generate synthesis report");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <FileSpreadsheet className="h-6 w-6 text-indigo-400" />
            <span>Multi-Document Synthesis Workspace</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Synthesize cross-document literature, compare methodologies side-by-side, and identify unaddressed gaps.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {reportHistory.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
            >
              <History className="h-3.5 w-3.5 text-slate-400" />
              <span>Report History ({reportHistory.length})</span>
            </button>
          )}

          {currentReport && (
            <button
              onClick={() => setIsExportOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 shadow-sm"
            >
              <Download className="h-3.5 w-3.5 text-indigo-400" />
              <span>Export Report</span>
            </button>
          )}
        </div>
      </div>

      {/* History Slide-down drawer */}
      {showHistory && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-md animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Workspace Synthesis Reports
            </span>
            <button onClick={() => setShowHistory(false)} className="text-xs text-slate-400 hover:text-white">
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {reportHistory.map((rep) => (
              <div
                key={rep.id}
                onClick={() => {
                  setCurrentReport(rep);
                  setShowHistory(false);
                }}
                className={`cursor-pointer rounded-xl border p-3 transition ${
                  currentReport?.id === rep.id
                    ? "border-indigo-500 bg-indigo-950/20"
                    : "border-slate-800 bg-slate-950/60 hover:bg-slate-900"
                }`}
              >
                <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 uppercase">
                  {rep.report_type.replace(/_/g, " ")}
                </span>
                <h5 className="mt-1.5 font-semibold text-xs text-slate-100 line-clamp-1">{rep.title}</h5>
                <p className="mt-1 text-[10px] text-slate-400">
                  {new Date(rep.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuration & Document Selector Accordion/Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-md space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              1. Select Documents to Compare ({selectedDocIds.length}/5)
            </h3>
          </div>
          <span className="text-xs text-slate-400">Select between 1 and 5 papers</span>
        </div>

        {/* Documents Selection Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {documents.map((doc) => {
            const isSelected = selectedDocIds.includes(doc.id);
            return (
              <div
                key={doc.id}
                onClick={() => handleToggleDoc(doc.id)}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-950/20 shadow-md shadow-indigo-500/10"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <div className="truncate">
                  <h4 className="font-semibold text-xs text-slate-100 truncate">{doc.title}</h4>
                  <p className="text-[11px] text-slate-400 truncate">{doc.primary_topic || doc.file_name}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Advisory Configuration Parameters (Section 9) */}
        <div className="border-t border-slate-800 pt-5 space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              2. Form & Advisory Configuration
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Report Mode */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Synthesis Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="LITERATURE_REVIEW">Literature Review</option>
                <option value="COMPARATIVE_MATRIX">Comparative Matrix</option>
                <option value="GAP_ANALYSIS">Gap & Validity Analysis</option>
              </select>
            </div>

            {/* Target Audience */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Target Audience
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="Peer Reviewer">Peer Reviewer</option>
                <option value="Executive">Executive</option>
                <option value="Policy Maker">Policy Maker</option>
                <option value="Layman">Layman / General Reader</option>
              </select>
            </div>

            {/* Output Depth */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Synthesis Depth
              </label>
              <select
                value={depth}
                onChange={(e) => setDepth(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="CONCISE">Concise Abstract (250w)</option>
                <option value="STANDARD">Standard Analysis (1000w)</option>
                <option value="EXHAUSTIVE">Exhaustive Meta-Analysis (3000w)</option>
              </select>
            </div>

            {/* Citation Style */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Citation Standard
              </label>
              <select
                value={citationStyle}
                onChange={(e) => setCitationStyle(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="APA7">APA 7th Edition</option>
                <option value="IEEE">IEEE Reference</option>
                <option value="HARVARD">Harvard Style</option>
                <option value="BIBTEX">BibTeX Format</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={handleGenerate}
            disabled={generating || selectedDocIds.length === 0}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-50"
          >
            <Sparkles className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
            <span>
              {generating
                ? "Synthesizing with Gemini 3.8..."
                : `Generate Synthesis on ${selectedDocIds.length} Document${selectedDocIds.length > 1 ? "s" : ""}`}
            </span>
          </button>
        </div>
      </div>

      {/* Synthesis Report Display */}
      {currentReport && (
        <div className="space-y-6 animate-in fade-in">
          {/* Executive Summary Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 md:p-8 shadow-xl backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="rounded bg-indigo-500/10 px-2.5 py-0.5 text-xs font-bold text-indigo-400 uppercase tracking-wider border border-indigo-500/20">
                  {currentReport.report_type.replace(/_/g, " ")}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(currentReport.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Audience: {currentReport.content_json.metadata?.targetAudience || targetAudience}</span>
                <span>•</span>
                <span>Citation: {currentReport.content_json.metadata?.citationStyle || citationStyle}</span>
              </div>
            </div>

            <h2 className="mt-4 text-xl md:text-2xl font-bold text-white leading-snug">
              {currentReport.content_json.title}
            </h2>

            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/70 p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-indigo-400" />
                Executive Synthesis Summary
              </h4>
              <p className="mt-3 text-xs md:text-sm text-slate-200 leading-relaxed font-sans">
                {currentReport.content_json.executiveSummary}
              </p>
            </div>
          </div>

          {/* Comparative Matrix Table */}
          <SynthesisMatrixTable
            comparisons={currentReport.content_json.comparativeAnalysis || []}
            documentTitles={documents.map((d) => ({ id: d.id, title: d.title }))}
          />

          {/* Research Gaps & Future Directions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Research Gaps */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-md backdrop-blur-sm space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Identified Research Gaps
                </h3>
              </div>
              <ul className="space-y-3">
                {currentReport.content_json.researchGaps?.map((gap, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-950/10 p-3.5 text-xs text-slate-200 leading-relaxed"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-300">
                      {idx + 1}
                    </span>
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Future Directions */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-md backdrop-blur-sm space-y-4">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Recommended Future Directions
                </h3>
              </div>
              <ul className="space-y-3">
                {currentReport.content_json.futureDirections?.map((dir, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-3.5 text-xs text-slate-200 leading-relaxed"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-[10px] font-bold text-emerald-300">
                      {idx + 1}
                    </span>
                    <span>{dir}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isExportOpen && currentReport && (
        <ExportModal report={currentReport} onClose={() => setIsExportOpen(false)} />
      )}
    </div>
  );
};
