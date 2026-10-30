import React from "react";
import { CheckCircle2, AlertTriangle, Layers, BookMarked } from "lucide-react";
import { ComparativeAnalysisTheme } from "../types/index.ts";

interface SynthesisMatrixTableProps {
  comparisons: ComparativeAnalysisTheme[];
  documentTitles?: { id: string; title: string }[];
}

export const SynthesisMatrixTable: React.FC<SynthesisMatrixTableProps> = ({
  comparisons,
  documentTitles = [],
}) => {
  const getDocTitle = (docId: string) => {
    const found = documentTitles.find((d) => d.id === docId);
    return found ? found.title : docId;
  };

  if (!comparisons || comparisons.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 text-center text-xs text-slate-400">
        No comparative themes identified for this synthesis job.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-md">
      <div className="border-b border-slate-800 bg-slate-950/70 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Cross-Document Comparative Analysis Matrix
          </h4>
        </div>
        <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-400 border border-indigo-500/20">
          {comparisons.length} Key Themes Identified
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-semibold">
              <th className="py-3 px-4 w-1/4">Research Theme</th>
              <th className="py-3 px-4 w-1/3">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Consensus & Shared Findings</span>
                </div>
              </th>
              <th className="py-3 px-4 w-1/3">
                <div className="flex items-center gap-1.5 text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Contradictions & Tension Points</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/70">
            {comparisons.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition">
                {/* Theme & Supporting Document Badges */}
                <td className="py-4 px-4 align-top">
                  <span className="font-semibold text-slate-100 text-sm">{item.theme}</span>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {item.supportingDocIds &&
                      item.supportingDocIds.map((docId) => (
                        <span
                          key={docId}
                          title={getDocTitle(docId)}
                          className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-indigo-300 border border-slate-700/60 max-w-[190px] truncate"
                        >
                          <BookMarked className="h-2.5 w-2.5 shrink-0 text-indigo-400" />
                          <span className="truncate">{getDocTitle(docId)}</span>
                        </span>
                      ))}
                  </div>
                </td>

                {/* Consensus */}
                <td className="py-4 px-4 align-top text-slate-300 leading-relaxed bg-emerald-950/5">
                  <p>{item.consensus}</p>
                </td>

                {/* Contradictions */}
                <td className="py-4 px-4 align-top text-slate-300 leading-relaxed bg-amber-950/5">
                  <p>{item.contradictions}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
