import React, { useState, useEffect } from "react";
import { MessageSquareText, Plus, MessageSquare, Clock, Trash2 } from "lucide-react";
import { ChatWindow } from "../components/ChatWindow.tsx";
import { useWorkspace } from "../context/WorkspaceContext.tsx";
import { api } from "../services/api.ts";
import { ChatMessage, ChatSession, ResearchDocument } from "../types/index.ts";

export const Chat: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [documents, setDocuments] = useState<ResearchDocument[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load chat sessions and workspace documents
  const loadWorkspaceData = async () => {
    if (!activeWorkspace) return;
    try {
      const [sessionsRes, docsRes] = await Promise.all([
        api.chat.listSessions(activeWorkspace.id),
        api.documents.list(activeWorkspace.id),
      ]);
      setSessions(sessionsRes.sessions || []);
      setDocuments(docsRes.documents || []);

      if (sessionsRes.sessions && sessionsRes.sessions.length > 0 && !activeSessionId) {
        setActiveSessionId(sessionsRes.sessions[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [activeWorkspace]);

  // Load messages whenever active session changes
  useEffect(() => {
    async function loadMessages() {
      if (!activeSessionId) {
        setMessages([]);
        return;
      }
      try {
        const res = await api.chat.getMessages(activeSessionId);
        setMessages(res.messages || []);
      } catch (err) {
        console.error(err);
      }
    }
    loadMessages();
  }, [activeSessionId]);

  const handleNewSession = () => {
    setActiveSessionId(null);
    setMessages([]);
  };

  const handleToggleDocSelect = (docId: string) => {
    if (selectedDocIds.includes(docId)) {
      setSelectedDocIds(selectedDocIds.filter((id) => id !== docId));
    } else {
      setSelectedDocIds([...selectedDocIds, docId]);
    }
  };

  const handleSelectAllDocs = () => {
    if (selectedDocIds.length > 0) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(documents.map((d) => d.id));
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeWorkspace) return;

    // Immediately push user message to UI
    const tempUserMsg: ChatMessage = {
      id: "temp_" + Date.now(),
      session_id: activeSessionId || "",
      sender: "USER",
      message: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await api.chat.sendMessage({
        workspaceId: activeWorkspace.id,
        message: text,
        sessionId: activeSessionId || undefined,
        documentIds: selectedDocIds.length > 0 ? selectedDocIds : undefined,
      });

      if (!activeSessionId) {
        setActiveSessionId(res.sessionId);
        // Refresh session list
        const sList = await api.chat.listSessions(activeWorkspace.id);
        setSessions(sList.sessions || []);
      }

      setMessages((prev) => [...prev, res.message]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: "err_" + Date.now(),
        session_id: activeSessionId || "",
        sender: "ASSISTANT",
        message: `Query error: ${err.message || "Could not retrieve knowledge answer."}`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Sessions Sidebar */}
      <div className="hidden lg:flex w-72 flex-col justify-between border-r border-slate-800 bg-slate-950 p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              RAG Conversations
            </h3>
            <button
              onClick={handleNewSession}
              className="flex items-center gap-1 rounded-lg bg-indigo-600/20 px-2 py-1 text-xs font-semibold text-indigo-400 hover:bg-indigo-600/30 transition border border-indigo-500/20"
            >
              <Plus className="h-3 w-3" />
              <span>New Query</span>
            </button>
          </div>

          <div className="max-h-[calc(100vh-14rem)] overflow-y-auto space-y-1.5">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs transition ${
                  activeSessionId === session.id
                    ? "bg-indigo-600/20 text-indigo-200 border border-indigo-500/30 font-semibold"
                    : "text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                <span className="truncate">{session.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-3 text-[11px] text-slate-500">
          Answers grounded with strict factual citations
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 p-4 md:p-6 overflow-hidden">
        <ChatWindow
          messages={messages}
          loading={loading}
          documents={documents}
          selectedDocIds={selectedDocIds}
          onToggleDocSelect={handleToggleDocSelect}
          onSelectAllDocs={handleSelectAllDocs}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
};
