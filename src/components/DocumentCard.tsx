import React from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  Database,
  Trash2,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { ResearchDocument } from "../types/index.ts";

interface DocumentCardProps {
  document: ResearchDocument;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onReprocess?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  isSelected = false,
  onToggleSelect,
  onReprocess,
  onDelete,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Parsed & Vectorized
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Gemini Parsing
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-400 border border-rose-500/20">
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
            Pending Extraction
          </span>
        );
    }
  };

  const formattedSize = (document.file_size_bytes / (1024 * 1024)).toFixed(2) + " MB";
  const formattedDate = new Date(document.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl border transition-all duration-200 ${
        isSelected
          ? "border-indigo-500 bg-slate-900 shadow-md shadow-indigo-500/10"
          : "border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900"
      } p-5 backdrop-blur-sm`}
    >
      <div>
        {/* Header row with checkbox & status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {onToggleSelect && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(document.id)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950 cursor-pointer"
              />
            )}
            <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-400 border border-indigo-500/20">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div>{getStatusBadge(document.status)}</div>
        </div>

        {/* Title */}
        <Link to={`/documents/${document.id}`} className="mt-3 block group-hover:text-indigo-300">
          <h4 className="font-semibold text-sm text-slate-100 line-clamp-2 leading-snug">
            {document.title}
          </h4>
        </Link>

        {/* Primary Topic Tag */}
        {document.primary_topic && (
          <div className="mt-2.5">
            <span className="inline-block rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700/60">
              {document.primary_topic}
            </span>
          </div>
        )}

        {/* Summary or Methodology preview */}
        <p className="mt-3 text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {document.summary || "Document parsed and ready for contextual synthesis."}
        </p>

        {/* Datasets pill if present */}
        {document.datasets_used && document.datasets_used.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Database className="h-3 w-3 text-indigo-400 shrink-0" />
            <span className="truncate">Datasets: {document.datasets_used.slice(0, 2).join(", ")}</span>
          </div>
        )}
      </div>

      {/* Footer Meta & Actions */}
      <div className="mt-5 border-t border-slate-800/80 pt-3 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span>{document.file_name}</span>
          <span>•</span>
          <span>{formattedSize}</span>
        </div>

        <div className="flex items-center gap-1">
          {onReprocess && (
            <button
              onClick={() => onReprocess(document.id)}
              title="Re-run Gemini extraction"
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-indigo-300"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(document.id)}
              title="Delete document"
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <Link
            to={`/documents/${document.id}`}
            className="flex items-center gap-1 font-medium text-indigo-400 hover:text-indigo-300 ml-1"
          >
            <span>View</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
