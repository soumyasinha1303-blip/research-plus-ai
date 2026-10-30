import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/auth.js";
import { query } from "../db/database.js";

export interface GraphNode {
  id: string;
  label: string;
  type: "document" | "topic" | "methodology" | "dataset" | "citation";
  val: number;
  docId?: string;
  metadata?: any;
}

export interface GraphLink {
  source: string;
  target: string;
  label?: string;
  strength?: number;
}

export async function getKnowledgeGraph(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.id;
  const workspaceId = req.query.workspaceId as string;

  try {
    let sql = `
      SELECT 
        d.id, d.title, d.file_name, d.summary,
        e.primary_topic, e.methodology, e.key_findings, e.limitations, e.datasets_used, e.citations_referenced
      FROM documents d
      LEFT JOIN document_entities e ON d.id = e.document_id
      WHERE d.user_id = $1
    `;
    const params: any[] = [userId];

    if (workspaceId) {
      sql += " AND d.workspace_id = $2";
      params.push(workspaceId);
    }

    const result = query(sql, params);
    const docs = result.rows;

    const nodesMap = new Map<string, GraphNode>();
    const links: GraphLink[] = [];

    // Helper to safely add node
    const addNode = (node: GraphNode) => {
      if (!nodesMap.has(node.id)) {
        nodesMap.set(node.id, node);
      } else {
        const existing = nodesMap.get(node.id)!;
        existing.val += 1; // increase importance
      }
    };

    // Helper to safely add link
    const addLink = (source: string, target: string, label: string) => {
      links.push({ source, target, label, strength: 1 });
    };

    docs.forEach((doc) => {
      const docNodeId = `doc_${doc.id}`;
      addNode({
        id: docNodeId,
        label: doc.title,
        type: "document",
        val: 18,
        docId: doc.id,
        metadata: {
          summary: doc.summary,
          fileName: doc.file_name,
        },
      });

      // Primary Topic
      if (doc.primary_topic) {
        const topicNodeId = `topic_${slugify(doc.primary_topic)}`;
        addNode({
          id: topicNodeId,
          label: doc.primary_topic,
          type: "topic",
          val: 14,
        });
        addLink(docNodeId, topicNodeId, "investigates");
      }

      // Methodology
      if (doc.methodology) {
        // truncate methodology for clean graph label
        const methLabel = doc.methodology.length > 50 ? doc.methodology.slice(0, 48) + "..." : doc.methodology;
        const methNodeId = `meth_${slugify(doc.methodology.slice(0, 30))}`;
        addNode({
          id: methNodeId,
          label: methLabel,
          type: "methodology",
          val: 12,
          metadata: { fullMethodology: doc.methodology },
        });
        addLink(docNodeId, methNodeId, "applies");
      }

      // Datasets
      if (doc.datasets_used && Array.isArray(doc.datasets_used)) {
        doc.datasets_used.slice(0, 4).forEach((ds: string) => {
          if (!ds || ds.length < 2) return;
          const dsNodeId = `dataset_${slugify(ds)}`;
          addNode({
            id: dsNodeId,
            label: ds,
            type: "dataset",
            val: 10,
          });
          addLink(docNodeId, dsNodeId, "evaluates_on");
        });
      }

      // Citations / Authors
      if (doc.citations_referenced && Array.isArray(doc.citations_referenced)) {
        doc.citations_referenced.slice(0, 3).forEach((cit: string) => {
          if (!cit || cit.length < 3) return;
          const citLabel = cit.length > 40 ? cit.slice(0, 38) + "..." : cit;
          const citNodeId = `cit_${slugify(cit.slice(0, 25))}`;
          addNode({
            id: citNodeId,
            label: citLabel,
            type: "citation",
            val: 8,
            metadata: { fullCitation: cit },
          });
          addLink(docNodeId, citNodeId, "cites");
        });
      }
    });

    res.json({
      nodes: Array.from(nodesMap.values()),
      links,
      stats: {
        totalNodes: nodesMap.size,
        totalEdges: links.length,
        documentCount: docs.length,
      },
    });
  } catch (err: any) {
    console.error("[getKnowledgeGraph] Error:", err);
    res.status(500).json({ error: "Failed to generate knowledge graph" });
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 40);
}
