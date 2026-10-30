import {
  User,
  Workspace,
  ResearchDocument,
  SynthesisReport,
  ChatSession,
  ChatMessage,
  KnowledgeGraphData,
} from "../types/index.ts";

const BASE_URL = "/api";

function getHeaders(isMultipart = false): HeadersInit {
  const token = localStorage.getItem("omni_token");
  const headers: Record<string, string> = {};

  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isMultipart = options.body instanceof FormData;
  const headers = getHeaders(isMultipart);

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg = data.message || data.error || `HTTP error ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  auth: {
    register: (payload: { email: string; password: string; fullName: string }) =>
      request<{ token: string; user: User; defaultWorkspaceId: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    login: (payload: { email: string; password: string }) =>
      request<{ token: string; user: User; defaultWorkspaceId: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    getMe: () => request<{ user: User }>("/auth/me"),
  },

  // Workspaces
  workspaces: {
    list: () => request<{ workspaces: Workspace[] }>("/workspaces"),
    create: (payload: { name: string; description?: string; domain?: string }) =>
      request<{ workspace: Workspace }>("/workspaces", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    getDashboardStats: () =>
      request<{
        metrics: {
          totalDocuments: number;
          completedDocuments: number;
          totalSyntheses: number;
          totalChatSessions: number;
        };
        recentDocs: ResearchDocument[];
        recentSyntheses: SynthesisReport[];
      }>("/workspaces/dashboard-stats"),
  },

  // Documents
  documents: {
    list: (workspaceId?: string) =>
      request<{ documents: ResearchDocument[] }>(
        `/documents${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ""}`
      ),
    getById: (id: string) => request<{ document: ResearchDocument }>(`/documents/${id}`),
    upload: (formData: FormData) =>
      request<{ message: string; document: any }>("/documents/upload", {
        method: "POST",
        body: formData,
      }),
    process: (id: string) =>
      request<{ message: string; entities: any }>(`/documents/${id}/process`, {
        method: "POST",
      }),
    delete: (id: string) => request<{ message: string }>(`/documents/${id}`, { method: "DELETE" }),
  },

  // Synthesis
  synthesis: {
    generate: (payload: {
      workspaceId: string;
      documentIds: string[];
      reportType: "LITERATURE_REVIEW" | "COMPARATIVE_MATRIX" | "GAP_ANALYSIS";
      formatOptions?: {
        depth?: "CONCISE" | "STANDARD" | "EXHAUSTIVE";
        citationStyle?: "APA7" | "IEEE" | "HARVARD" | "BIBTEX";
        targetAudience?: "Executive" | "Peer Reviewer" | "Layman" | "Policy Maker";
        tone?: "Academic" | "Analytical" | "Critical" | "Prescriptive";
      };
    }) =>
      request<{ message: string; reportId: string; synthesis: any }>("/synthesis/generate", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    listReports: (workspaceId?: string) =>
      request<{ reports: SynthesisReport[] }>(
        `/synthesis/reports${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ""}`
      ),
    getReportById: (id: string) =>
      request<{ report: SynthesisReport }>(`/synthesis/reports/${id}`),
  },

  // Contextual RAG Chat
  chat: {
    sendMessage: (payload: {
      workspaceId: string;
      message: string;
      sessionId?: string;
      documentIds?: string[];
    }) =>
      request<{ sessionId: string; message: ChatMessage }>("/chat/message", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    listSessions: (workspaceId?: string) =>
      request<{ sessions: ChatSession[] }>(
        `/chat/sessions${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ""}`
      ),
    getMessages: (sessionId: string) =>
      request<{ messages: ChatMessage[] }>(`/chat/sessions/${sessionId}/messages`),
  },

  // Knowledge Graph
  graph: {
    getGraph: (workspaceId?: string) =>
      request<KnowledgeGraphData>(
        `/knowledge-graph${workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ""}`
      ),
  },

  // System
  system: {
    status: () =>
      request<{
        name: string;
        status: string;
        engine: string;
        hasApiKey: boolean;
        timestamp: string;
      }>("/system/status"),
  },
};
