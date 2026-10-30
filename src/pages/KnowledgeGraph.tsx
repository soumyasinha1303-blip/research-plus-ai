import React, { useState, useEffect } from "react";
import { Network, Sparkles, Layers, RefreshCw, Info } from "lucide-react";
import { KnowledgeGraphCanvas } from "../components/KnowledgeGraphCanvas.tsx";
import { useWorkspace } from "../context/WorkspaceContext.tsx";
import { api } from "../services/api.ts";
import { KnowledgeGraphData } from "../types/index.ts";

export const KnowledgeGraph: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const [graphData, setGraphData] = useState<KnowledgeGraphData>({
    nodes: [],
    links: [],
    stats: { totalNodes: 0, totalEdges: 0, documentCount: 0 },
  });
  const [loading, setLoading] = useState(true);

  const loadGraph = async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      const res = await api.graph.getGraph(activeWorkspace.id);
      setGraphData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [activeWorkspace]);

  return (
    <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Network className="h-6 w-6 text-indigo-400" />
            <span>Interactive Research Knowledge Graph</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Semantic entity-relationship network mapping documents, extracted methodologies, datasets, and cross-citations.
          </p>
        </div>

        <button
          onClick={loadGraph}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-800"
        >
          <RefreshCw className="h-3.5 w-3.5 text-indigo-400" />
          <span>Refresh Graph</span>
        </button>
      </div>

      {/* Main Graph Component */}
      {loading ? (
        <div className="flex h-[550px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <RefreshCw className="h-5 w-5 animate-spin text-indigo-400" />
            <span>Computing entity-relationship physics vectors...</span>
          </div>
        </div>
      ) : graphData.nodes.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-12 text-center text-xs text-slate-400">
          No extracted research entities available. Ingest documents in the Document Vault to populate the knowledge graph.
        </div>
      ) : (
        <KnowledgeGraphCanvas graphData={graphData} />
      )}

      {/* Explanatory Guide Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-500"></span>
            <h4 className="text-xs font-bold text-slate-200">Documents & Hubs</h4>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
            Central paper nodes represent ingested preprints and literature articles in your active workspace.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400"></span>
            <h4 className="text-xs font-bold text-slate-200">Topics & Methods</h4>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
            Cyan and purple nodes identify core algorithmic formulations, theoretical frameworks, and taxonomies.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
            <h4 className="text-xs font-bold text-slate-200">Datasets & Citations</h4>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
            Green and amber nodes represent empirical benchmarks and foundational prior works cited across the corpus.
          </p>
        </div>
      </div>
    </div>
  );
};
