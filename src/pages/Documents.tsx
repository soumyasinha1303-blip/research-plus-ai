import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  UploadCloud,
  Search,
  Filter,
  Layers,
  Sparkles,
  ArrowRight,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import { DocumentCard } from "../components/DocumentCard.tsx";
import { FileUploadModal } from "../components/FileUploadModal.tsx";
import { useWorkspace } from "../context/WorkspaceContext.tsx";
import { api } from "../services/api.ts";
import { ResearchDocument } from "../types/index.ts";

export const Documents: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const [documents, setDocuments] = useState<ResearchDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const navigate = useNavigate();

  const loadDocuments = async () => {
    if (!activeWorkspace) return;
    try {
      setLoading(true);
      const res = await api.documents.list(activeWorkspace.id);
      setDocuments(res.documents || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    setSelectedDocIds([]);
  }, [activeWorkspace]);

  const handleToggleSelect = (docId: string) => {
    if (selectedDocIds.includes(docId)) {
      setSelectedDocIds(selectedDocIds.filter((id) => id !== docId));
    } else {
      if (selectedDocIds.length >= 5) {
        alert("Maximum 5 documents can be selected for simultaneous comparative synthesis.");
        return;
      }
      setSelectedDocIds([...selectedDocIds, docId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedDocIds.length === filteredDocuments.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(filteredDocuments.slice(0, 5).map((d) => d.id));
    }
  };

  const handleReprocess = async (docId: string) => {
    try {
      await api.documents.process(docId);
      loadDocuments();
    } catch (err: any) {
      alert("Extraction error: " + err.message);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm("Delete this document and its extracted semantic entities?")) return;
    try {
      await api.documents.delete(docId);
      setSelectedDocIds(selectedDocIds.filter((id) => id !== docId));
      loadDocuments();
    } catch (err: any) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleLaunchSynthesis = () => {
    navigate("/synthesis", { state: { selectedDocIds } });
  };

  const filteredDocuments = documents.filter((doc) => {
    if (statusFilter !== "ALL" && doc.status !== statusFilter) return false;
    if (
      searchTerm.trim() &&
      !doc.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !doc.primary_topic?.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !doc.summary?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header and Ingest CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-indigo-400" />
            <span>Document Vault & Research Corpus</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Ingest preprints, PDFs, and datasets for automated semantic parsing and multi-document synthesis.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 backdrop-blur-md">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by paper title, primary topic, or abstract keywords..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Filter by Status */}
        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Parsing Status</option>
            <option value="COMPLETED">Completed & Indexed</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING">Pending</option>
          </select>

          {filteredDocuments.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-850"
            >
              {selectedDocIds.length === filteredDocuments.length ? (
                <CheckSquare className="h-3.5 w-3.5 text-indigo-400" />
              ) : (
                <Square className="h-3.5 w-3.5 text-slate-400" />
              )}
              <span>Select Max (5)</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Action Bar when papers are selected */}
      {selectedDocIds.length > 0 && (
        <div className="sticky top-20 z-30 flex items-center justify-between rounded-xl border border-indigo-500/40 bg-indigo-950/90 px-5 py-3 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
              {selectedDocIds.length}
            </span>
            <span className="text-xs font-semibold text-slate-100">
              {selectedDocIds.length} document{selectedDocIds.length > 1 ? "s" : ""} selected for synthesis
            </span>
            <span className="text-[11px] text-indigo-300 hidden sm:inline">(Max 5)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDocIds([])}
              className="rounded-lg border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-200 hover:bg-indigo-900/40"
            >
              Clear
            </button>
            <button
              onClick={handleLaunchSynthesis}
              className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-indigo-400"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Launch Comparative Synthesis</span>
            </button>
          </div>
        </div>
      )}

      {/* Documents Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-xl border border-slate-800 bg-slate-900/40 animate-pulse" />
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-400 mb-3">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-white">No research documents found</h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {searchTerm
              ? "No papers match your search keywords. Try adjusting your query."
              : "Upload PDF papers, TXT preprints, or CSV datasets to begin semantic extraction."}
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Paper</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              isSelected={selectedDocIds.includes(doc.id)}
              onToggleSelect={handleToggleSelect}
              onReprocess={handleReprocess}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => loadDocuments()}
      />
    </div>
  );
};
