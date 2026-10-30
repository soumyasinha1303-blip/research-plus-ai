import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Workspace } from "../types/index.ts";
import { api } from "../services/api.ts";
import { useAuth } from "./AuthContext.tsx";

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  setActiveWorkspace: (ws: Workspace) => void;
  createWorkspace: (name: string, description?: string, domain?: string) => Promise<Workspace>;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshWorkspaces = useCallback(async () => {
    if (!token) {
      setWorkspaces([]);
      setActiveWorkspaceState(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.workspaces.list();
      setWorkspaces(res.workspaces || []);

      if (res.workspaces && res.workspaces.length > 0) {
        // If current active is still in list, keep it, otherwise select first
        const savedId = localStorage.getItem("omni_active_ws");
        const found = res.workspaces.find((w) => w.id === savedId);
        const selected = found || res.workspaces[0];
        setActiveWorkspaceState(selected);
        localStorage.setItem("omni_active_ws", selected.id);
      } else {
        setActiveWorkspaceState(null);
      }
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces, user]);

  const setActiveWorkspace = (ws: Workspace) => {
    setActiveWorkspaceState(ws);
    localStorage.setItem("omni_active_ws", ws.id);
  };

  const createWorkspace = async (name: string, description?: string, domain?: string): Promise<Workspace> => {
    const res = await api.workspaces.create({ name, description, domain });
    await refreshWorkspaces();
    setActiveWorkspace(res.workspace);
    return res.workspace;
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        loading,
        setActiveWorkspace,
        createWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
