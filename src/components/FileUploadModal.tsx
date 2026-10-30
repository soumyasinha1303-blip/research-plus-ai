import React, { useState, useRef } from "react";
import { UploadCloud, File as FileIcon, AlertCircle, CheckCircle2, X, FileText } from "lucide-react";
import { api } from "../services/api.ts";
import { useWorkspace } from "../context/WorkspaceContext.tsx";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { activeWorkspace } = useWorkspace();
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<"file" | "paste">("file");

  // Raw text paste mode
  const [pastedTitle, setPastedTitle] = useState("");
  const [pastedText, setPastedText] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validExtensions = [".pdf", ".csv", ".txt", ".md"];
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase();

    if (!validExtensions.includes(ext)) {
      setError("Unsupported format. Please upload PDF, CSV, TXT, or Markdown documents.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File exceeds maximum allowable size (10MB).");
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!activeWorkspace) {
      setError("No active workspace selected");
      return;
    }

    setUploading(true);
    setProgress(15);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("workspaceId", activeWorkspace.id);

      if (mode === "file") {
        if (!file) {
          setError("Please select a file to upload");
          setUploading(false);
          return;
        }
        formData.append("file", file);
      } else {
        if (!pastedTitle.trim() || !pastedText.trim()) {
          setError("Please provide both title and content text");
          setUploading(false);
          return;
        }
        const textBlob = new Blob([pastedText], { type: "text/markdown" });
        const textFile = new File([textBlob], `${pastedTitle.replace(/\s+/g, "_")}.md`, {
          type: "text/markdown",
        });
        formData.append("file", textFile);
      }

      setProgress(55);
      await api.documents.upload(formData);
      setProgress(100);

      setTimeout(() => {
        setUploading(false);
        setFile(null);
        setPastedTitle("");
        setPastedText("");
        onSuccess();
        onClose();
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to upload and parse document");
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-white">Ingest Research Document</h3>
            <p className="text-xs text-slate-400">
              Target: <span className="text-indigo-400 font-medium">{activeWorkspace?.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-800 px-6">
          <button
            onClick={() => setMode("file")}
            className={`border-b-2 py-2.5 text-xs font-medium transition ${
              mode === "file" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            File Upload (PDF / CSV / TXT / MD)
          </button>
          <button
            onClick={() => setMode("paste")}
            className={`ml-6 border-b-2 py-2.5 text-xs font-medium transition ${
              mode === "paste" ? "border-indigo-500 text-indigo-400" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Paste Raw Text / Preprint
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === "file" ? (
            <div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition ${
                  dragOver
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.csv,.txt,.md,text/plain,application/pdf,text/csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      validateAndSetFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="rounded-full bg-slate-900 p-3 text-indigo-400 border border-slate-800 shadow-inner">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-200">
                  Click to browse or drag and drop paper
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Supports PDF papers, CSV datasets, Markdown preprints & TXT (up to 10MB)
                </p>
              </div>

              {file && (
                <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950 p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-indigo-500/10 p-2 text-indigo-400">
                      <FileIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{file.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    className="text-slate-500 hover:text-slate-300 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">Document Title</label>
                <input
                  type="text"
                  value={pastedTitle}
                  onChange={(e) => setPastedTitle(e.target.value)}
                  placeholder="e.g. Empirical Study on Transformer Memory Pruning"
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300">Document Content / Markdown</label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  rows={8}
                  placeholder="Paste abstract, methodology, results, or full research text here..."
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs font-mono text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Progress bar during parsing */}
          {uploading && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Parsing & extracting semantic vectors...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              disabled={uploading}
              className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || (mode === "file" && !file) || (mode === "paste" && (!pastedTitle || !pastedText))}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{uploading ? "Ingesting..." : "Ingest & Extract"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
