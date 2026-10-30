export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt?: string;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  domain: string;
  document_count?: number;
  synthesis_count?: number;
  created_at: string;
}

export interface DocumentEntity {
  id: string;
  document_id: string;
  primary_topic: string;
  methodology: string;
  key_findings: string[];
  limitations: string[];
  datasets_used: string[];
  citations_referenced: string[];
  raw_ai_metadata?: Record<string, any>;
  created_at?: string;
}

export interface ResearchDocument {
  id: string;
  workspace_id: string;
  title: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  summary?: string;
  raw_content?: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  error_message?: string;
  created_at: string;
  primary_topic?: string;
  methodology?: string;
  key_findings?: string[];
  limitations?: string[];
  datasets_used?: string[];
  citations_referenced?: string[];
}

export interface ComparativeAnalysisTheme {
  theme: string;
  consensus: string;
  contradictions: string;
  supportingDocIds: string[];
}

export interface SynthesisReportContent {
  title: string;
  executiveSummary: string;
  comparativeAnalysis: ComparativeAnalysisTheme[];
  researchGaps: string[];
  futureDirections: string[];
  metadata?: {
    reportType: string;
    targetAudience: string;
    depth: string;
    citationStyle: string;
    tone: string;
    generatedAt: string;
    documentCount: number;
    documentTitles: { id: string; title: string }[];
  };
}

export interface SynthesisReport {
  id: string;
  workspace_id: string;
  title: string;
  document_ids: string[];
  report_type: "LITERATURE_REVIEW" | "COMPARATIVE_MATRIX" | "GAP_ANALYSIS";
  content_json: SynthesisReportContent;
  created_at: string;
}

export interface SourceCitation {
  docId: string;
  title: string;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender: "USER" | "ASSISTANT";
  message: string;
  sources?: SourceCitation[];
  created_at: string;
}

export interface ChatSession {
  id: string;
  workspace_id: string;
  title: string;
  created_at: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: "document" | "topic" | "methodology" | "dataset" | "citation";
  val: number;
  docId?: string;
  metadata?: any;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  label?: string;
  strength?: number;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    documentCount: number;
  };
}
