import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.tsx";
import { WorkspaceProvider } from "./context/WorkspaceContext.tsx";
import { Navbar } from "./components/Navbar.tsx";
import { Sidebar } from "./components/Sidebar.tsx";
import { Dashboard } from "./pages/Dashboard.tsx";
import { Documents } from "./pages/Documents.tsx";
import { DocumentDetail } from "./pages/DocumentDetail.tsx";
import { Synthesis } from "./pages/Synthesis.tsx";
import { Chat } from "./pages/Chat.tsx";
import { KnowledgeGraph } from "./pages/KnowledgeGraph.tsx";
import { Settings } from "./pages/Settings.tsx";
import { Login } from "./pages/Login.tsx";
import { Register } from "./pages/Register.tsx";
import { Sparkles, RefreshCw } from "lucide-react";

const ProtectedLayout: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-600/30 animate-pulse">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <p className="text-xs font-semibold text-slate-400">Initializing OmniResearch AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <WorkspaceProvider>
      <div className="flex min-h-screen flex-col bg-slate-950 font-sans text-slate-100">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/documents/:id" element={<DocumentDetail />} />
              <Route path="/synthesis" element={<Synthesis />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/knowledge-graph" element={<KnowledgeGraph />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </WorkspaceProvider>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
