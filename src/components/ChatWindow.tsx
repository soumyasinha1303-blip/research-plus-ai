import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  User,
  Bot,
  BookOpen,
  Info,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  Layers,
  Copy,
  Check,
} from "lucide-react";
import { ChatMessage, ResearchDocument, SourceCitation } from "../types/index.ts";

interface ChatWindowProps {
  messages: ChatMessage[];
  loading: boolean;
  documents: ResearchDocument[];
  selectedDocIds: string[];
  onToggleDocSelect: (docId: string) => void;
  onSelectAllDocs: () => void;
  onSendMessage: (text: string) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  loading,
  documents,
  selectedDocIds,
  onToggleDocSelect,
  onSelectAllDocs,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState("");
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [activeCitation, setActiveCitation] = useState<SourceCitation | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const starterPrompts = [
    "Synthesize the methodological differences across the ingested papers.",
    "What are the primary empirical benchmarks and reported accuracies?",
    "Identify the shared limitations and unaddressed research gaps.",
    "How do the authors optimize memory complexity or execution latency?",
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-md">
      {/* Chat Header with Document Filter */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-950/80 px-5 py-3 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/20">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Grounded RAG Research Assistant
            </h3>
            <p className="text-[11px] text-slate-400">
              Grounded exclusively in {documents.length} workspace papers
            </p>
          </div>
        </div>

        {/* Document Scope Selector */}
        <div className="relative">
          <button
            onClick={() => setShowDocPicker(!showDocPicker)}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-700"
          >
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            <span>
              Scope:{" "}
              {selectedDocIds.length === 0
                ? "All Workspace Papers"
                : `${selectedDocIds.length} Selected Papers`}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {showDocPicker && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-800 bg-slate-950 p-2 shadow-2xl z-30 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 px-1">
                <span className="text-[11px] font-semibold uppercase text-slate-400">
                  Select Context Papers
                </span>
                <button
                  onClick={onSelectAllDocs}
                  className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300"
                >
                  {selectedDocIds.length === 0 ? "Filter Specific" : "Reset to All"}
                </button>
              </div>
              <div className="max-h-52 overflow-y-auto space-y-1 mt-2">
                {documents.map((doc) => (
                  <label
                    key={doc.id}
                    className="flex items-center gap-2 rounded-lg p-2 text-xs text-slate-300 hover:bg-slate-900 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocIds.includes(doc.id)}
                      onChange={() => onToggleDocSelect(doc.id)}
                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0"
                    />
                    <span className="truncate">{doc.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Message History Thread */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-2xl bg-indigo-500/10 p-4 text-indigo-400 border border-indigo-500/20 mb-4">
              <Sparkles className="h-8 w-8" />
            </div>
            <h4 className="text-base font-bold text-white">Ask Contextual Research Questions</h4>
            <p className="mt-1 max-w-md text-xs text-slate-400">
              OmniResearch RAG retrieves exact excerpts and claims across your active papers with
              verifiable bracketed citations.
            </p>

            {/* Prompt Starter Chips */}
            <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg">
              {starterPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(prompt)}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-left text-xs text-slate-300 transition hover:border-indigo-500/50 hover:bg-indigo-950/20 hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === "USER" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "ASSISTANT" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow">
                  <Bot className="h-4 w-4" />
                </div>
              )}

              <div
                className={`group relative max-w-2xl rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                  msg.sender === "USER"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "border border-slate-800 bg-slate-950/80 text-slate-200 rounded-tl-none"
                }`}
              >
                {/* Content */}
                <div className="whitespace-pre-wrap font-sans">
                  {msg.message}
                </div>

                {/* Sources / Citations Drawer */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3.5 border-t border-slate-800/80 pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
                      <BookOpen className="h-3 w-3 text-indigo-400" />
                      Referenced Document Evidence ({msg.sources.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((src, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => setActiveCitation(src)}
                          className="flex items-center gap-1 rounded bg-slate-900 border border-slate-800 px-2 py-1 text-[10px] font-medium text-indigo-300 hover:border-indigo-500 hover:text-white transition max-w-[220px] truncate"
                        >
                          <span className="truncate">{src.title}</span>
                          <ExternalLink className="h-2.5 w-2.5 shrink-0 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Copy button */}
                <button
                  onClick={() => copyToClipboard(msg.message, msg.id)}
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition p-1 text-slate-400 hover:text-white rounded bg-slate-900/60"
                  title="Copy to clipboard"
                >
                  {copiedId === msg.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>

              {msg.sender === "USER" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-3 text-xs text-slate-400 animate-pulse">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce"></span>
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
              <span className="ml-2 font-mono text-[11px]">Gemini 3.8 synthesizing literature context...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="border-t border-slate-800 bg-slate-950 p-4">
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-2 focus-within:border-indigo-500 transition">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a question about claims, methodologies, or findings in these papers..."
            disabled={loading}
            className="flex-1 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-500 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>

      {/* Active Citation Inspect Drawer */}
      {activeCitation && (
        <div className="border-t border-slate-800 bg-slate-950 p-4 animate-in slide-in-from-bottom">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-400" />
              <h5 className="font-semibold text-xs text-white truncate max-w-md">
                Source Document: {activeCitation.title}
              </h5>
            </div>
            <button
              onClick={() => setActiveCitation(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-300 font-mono bg-slate-900/80 p-3 rounded-lg border border-slate-800">
            "{activeCitation.snippet}"
          </p>
        </div>
      )}
    </div>
  );
};
