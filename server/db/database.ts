import { DatabaseSync } from "node:sqlite";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const DATA_DIR = path.resolve(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, "omni_research.db");
const sqlite = new DatabaseSync(DB_FILE);

// Enable WAL mode and foreign keys for performance and integrity
try {
  sqlite.exec("PRAGMA journal_mode = WAL;");
  sqlite.exec("PRAGMA foreign_keys = ON;");
} catch (e) {
  console.warn("PRAGMA error (non-fatal):", e);
}

export function generateUUID(): string {
  return crypto.randomUUID();
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

// Convert PostgreSQL $1, $2, $3 syntax to SQLite ? and handle query
export function query<T = any>(text: string, params: any[] = []): QueryResult<T> {
  let sqliteQuery = text.replace(/\$(\d+)/g, "?");
  
  // Clean up any postgres specific keywords if present
  sqliteQuery = sqliteQuery
    .replace(/uuid_generate_v4\(\)/gi, "lower(hex(randomblob(16)))")
    .replace(/NOW\(\)/gi, "datetime('now')")
    .replace(/CURRENT_TIMESTAMP/gi, "datetime('now')")
    .replace(/TIMESTAMP WITH TIME ZONE/gi, "TEXT")
    .replace(/UUID\[\]/gi, "TEXT")
    .replace(/UUID/gi, "TEXT")
    .replace(/JSONB/gi, "TEXT")
    .replace(/BIGINT/gi, "INTEGER")
    .replace(/VARCHAR\(\d+\)/gi, "TEXT")
    .replace(/ON CONFLICT DO NOTHING/gi, "OR IGNORE");

  const trimmed = sqliteQuery.trim();
  const isSelect = trimmed.toUpperCase().startsWith("SELECT") || trimmed.toUpperCase().startsWith("PRAGMA");

  try {
    const stmt = sqlite.prepare(sqliteQuery);
    
    // Normalize params (e.g. JSON stringify arrays/objects if passed)
    const normalizedParams = params.map((p) => {
      if (p !== null && typeof p === "object") {
        return JSON.stringify(p);
      }
      return p;
    });

    if (isSelect) {
      const rows = stmt.all(...normalizedParams) as T[];
      return {
        rows: rows.map(hydrateRow),
        rowCount: rows.length,
      };
    } else {
      const result = stmt.run(...normalizedParams);
      // For INSERT ... RETURNING or general inserts
      return {
        rows: [],
        rowCount: Number(result.changes),
      };
    }
  } catch (err: any) {
    console.error(`[DB Query Error] Query: "${sqliteQuery}" | Error:`, err);
    throw err;
  }
}

// Automatically parse JSON string fields from SQLite
function hydrateRow(row: any): any {
  if (!row) return row;
  const hydrated: any = { ...row };
  const jsonFields = [
    "key_findings",
    "limitations",
    "datasets_used",
    "citations_referenced",
    "raw_ai_metadata",
    "content_json",
    "document_ids",
    "sources",
  ];

  for (const field of jsonFields) {
    if (field in hydrated && typeof hydrated[field] === "string") {
      try {
        hydrated[field] = JSON.parse(hydrated[field]);
      } catch {
        // Keep as string if not valid JSON
      }
    }
  }
  return hydrated;
}

export function initDatabase(): void {
  console.log("[OmniResearch AI] Initializing Database Schema...");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      domain TEXT DEFAULT 'General Academic',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size_bytes INTEGER NOT NULL,
      raw_content TEXT NOT NULL,
      summary TEXT,
      status TEXT DEFAULT 'PENDING',
      error_message TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS document_entities (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      primary_topic TEXT,
      methodology TEXT,
      key_findings TEXT,
      limitations TEXT,
      datasets_used TEXT,
      citations_referenced TEXT,
      raw_ai_metadata TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(document_id) REFERENCES documents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS synthesis_reports (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      document_ids TEXT NOT NULL,
      report_type TEXT NOT NULL,
      content_json TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      sources TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_documents_workspace ON documents(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
    CREATE INDEX IF NOT EXISTS idx_entities_document ON document_entities(document_id);
    CREATE INDEX IF NOT EXISTS idx_synthesis_workspace ON synthesis_reports(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
  `);

  seedDefaultData();
  console.log("[OmniResearch AI] Database initialized successfully.");
}

function seedDefaultData() {
  const existingUsers = query("SELECT COUNT(*) as count FROM users").rows[0]?.count;
  if (existingUsers && Number(existingUsers) > 0) {
    return;
  }

  console.log("[OmniResearch AI] Seeding Demo Researcher workspace and academic papers...");

  const demoUserId = "u_demo_researcher_001";
  const demoEmail = "demo@omniresearch.ai";
  const demoPasswordHash = bcrypt.hashSync("password123", 10);
  const demoName = "Dr. Elena Rostova";

  query(
    `INSERT INTO users (id, email, password_hash, full_name) VALUES ($1, $2, $3, $4)`,
    [demoUserId, demoEmail, demoPasswordHash, demoName]
  );

  const demoWorkspaceId = "ws_primary_discovery_001";
  query(
    `INSERT INTO workspaces (id, user_id, name, description, domain) VALUES ($1, $2, $3, $4, $5)`,
    [
      demoWorkspaceId,
      demoUserId,
      "Frontiers in AI Reasoning & Autonomous Systems",
      "Comprehensive multi-document study investigating test-time compute, architectural latency, and verifiable reasoning scaffolds.",
      "Computer Science & AI Research",
    ]
  );

  const samplePapers = [
    {
      id: "doc_seed_001",
      title: "Self-Refining Latent Tree Search for Multi-Step Algorithmic Verification",
      fileName: "latent_tree_search_2025.pdf",
      fileType: "application/pdf",
      fileSize: 1048576 * 2.4,
      summary: "This paper proposes a verifiable tree-of-thought architecture that decouples semantic hypothesis generation from formal execution verifiers, reducing logical hallucination by 41.8% on GSM8K and Olympic-tier code synthesis benchmarks.",
      content: `ABSTRACT:
Recent advances in autoregressive reasoning demonstrate that allocating test-time compute through search graphs outperforms static greedy decoding. However, existing tree-search mechanisms suffer from search-space explosion and noisy value estimates. We introduce Latent Tree Search (LTS), a hierarchical inference algorithm that generates candidate proof trajectories in a compressed latent manifold, coupled with a formal execution sandbox.

1. INTRODUCTION & RELATED WORK
Mathematical synthesis and algorithmic code generation demand strict precision. Traditional Monte Carlo Tree Search (MCTS) applied to discrete token spaces suffers from quadratic node branching. Prior works like AlphaCode and Tree-of-Thought (Yao et al., 2023) lack deterministic verification feedback during trajectory exploration.

2. METHODOLOGY
LTS models reasoning as a partially observable Markov Decision Process (POMDP). State representations are embedded via an encoder into 768-dimensional latent vector nodes. A bidirectional value head scores partial proofs. When confidence drops below threshold theta = 0.72, the policy backtracks to the lowest entropy parent node. A deterministic Python/Lean4 sandbox acts as the ground-truth oracle.

3. EMPIRICAL RESULTS
On MATH500, LTS achieves 89.4% accuracy (an absolute +11.2% lift over standard Chain-of-Thought). On HumanEval-Hard, execution pass@1 reaches 84.7%. Latency is amortized via branch pruning, yielding a 3.4x speedup over standard Beam Search with equivalent node counts.

4. LIMITATIONS & ETHICS
LTS requires an active formal environment for ground truth feedback. When applied to non-verifiable subjective domains (such as creative writing or clinical discourse), value heuristic calibration degrades. High GPU memory footprint is observed during depth > 12 tree expansions.`,
      entities: {
        primaryTopic: "Test-Time Search & Formal Verification in LLMs",
        methodology: "Hierarchical Latent POMDP Search with Bidirectional Value Estimation and Lean4 Execution Verification",
        keyFindings: [
          "Achieved 89.4% accuracy on MATH500 (+11.2% over standard Chain-of-Thought baseline)",
          "Pass@1 on HumanEval-Hard reached 84.7% with automated execution feedback",
          "Decoupled latent state search reduced node exploration latency by 3.4x compared to token-space Beam Search",
          "Backtracking mechanism triggered when confidence falls below theta = 0.72 successfully prevented cascading errors"
        ],
        limitations: [
          "Requires deterministic runtime environments (e.g. Lean4 or Python sandbox) for ground-truth feedback",
          "Degrades on subjective or unconstrained qualitative domains without discrete assertions",
          "High VRAM overhead when tree exploration depth exceeds 12 nodes"
        ],
        datasetsUsed: ["MATH-500", "HumanEval-Hard", "GSM8K-Robust", "OlympicBench-Math"],
        citationsReferenced: [
          "Yao et al. (2023) Tree of Thoughts: Deliberate Problem Solving with Large Language Models",
          "Silver et al. (2018) A general reinforcement learning algorithm that masters chess, shogi, and Go",
          "Lightman et al. (2023) Let's Verify Step by Step"
        ]
      }
    },
    {
      id: "doc_seed_002",
      title: "Mechanistic Interpretability of Induction Heads in Sparse Autoencoder Networks",
      fileName: "sparse_autoencoders_induction_heads.pdf",
      fileType: "application/pdf",
      fileSize: 1048576 * 1.8,
      summary: "An exhaustive mechanistic investigation into how sparse dictionary learning identifies discrete computational circuits for in-context learning and factual recall in 70B parameter models.",
      content: `ABSTRACT:
Understanding internal circuit mechanics of transformer models remains a central challenge in AI safety. We apply TopK Sparse Autoencoders (SAEs) with 65,536 features to the residual streams of middle layers in 70B foundation models. We locate polysemantic superposition and isolate monosemantic feature clusters directly responsible for in-context induction.

1. MOTIVATION
Large models compress billions of facts into low-dimensional residual streams, giving rise to superposition. Previous dictionary learning using L1 penalties suffered from feature shrinkage and dead latents.

2. METHODOLOGY & ARCHITECTURE
We implement TopK SAEs with k=32 active latents per token. The loss function optimizes reconstruction MSE without sparsity penalties, bypassing L1 shrinkage. We track token attribution using activation patching across 10,000 algorithmic repetition sequences.

3. KEY FINDINGS
We isolate 142 distinct monosemantic features associated with 2-step induction heads in layers 14-18. Ablating these specific features drops in-context copying accuracy from 96.2% to 14.1%, while general linguistic perplexity shifts by less than 0.04%. Furthermore, cross-entropy loss on factual recall is localized to 18 specific attention heads.

4. LIMITATIONS & FUTURE WORK
Feature absorption remains an issue where infrequent concepts are split across multiple redundant latents. Scaling dictionary size to 1M features requires distributed tensor parallelism.`,
      entities: {
        primaryTopic: "Mechanistic Interpretability & In-Context Induction Circuits",
        methodology: "TopK Sparse Autoencoder (SAE) Dictionary Learning with Activation Patching and Residual Stream Decomposition",
        keyFindings: [
          "Isolated 142 monosemantic induction features in transformer layers 14-18 using TopK (k=32) SAEs",
          "Targeted feature ablation reduced in-context sequence copy accuracy from 96.2% to 14.1% with minimal general perplexity shift (<0.04)",
          "Bypassed classical L1 shrinkage issues while maintaining high reconstruction fidelity (R2 > 0.94)",
          "Verified that in-context learning behavior is driven by sparse sub-circuits rather than diffuse global representations"
        ],
        limitations: [
          "Feature absorption still occurs for low-frequency edge concepts",
          "High computational cost requiring distributed tensor parallelism for dictionaries exceeding 1M latents",
          "Evaluation limited to deterministic synthetic token repetition tasks"
        ],
        datasetsUsed: ["OpenWebText-Validation", "The Pile (Synthetic Repetition Split)", "Neel Nanda In-Context Benchmark"],
        citationsReferenced: [
          "Elhage et al. (2021) A Mathematical Framework for Transformer Circuits",
          "Bricken et al. (2023) Towards Monosemanticity: Decomposing Language Models With Dictionary Learning",
          "Anthropic Interpretability Team (2024) Scaling Monosemanticity"
        ]
      }
    },
    {
      id: "doc_seed_003",
      title: "Dynamic Token Pruning and KV-Cache Compression for Infinite Context Windows",
      fileName: "kv_cache_compression_infinite_context.pdf",
      fileType: "application/pdf",
      fileSize: 1048576 * 3.1,
      summary: "A practical systems engineering paper demonstrating an attention-entropy KV cache pruning strategy that retains 99.1% retrieval needle-in-a-haystack accuracy while reducing GPU memory footprint by 73%.",
      content: `ABSTRACT:
Long-context reasoning is fundamentally bottlenecked by Key-Value (KV) cache memory complexity, which scales linearly with context length and batch size. We introduce AttnSparsify, an adaptive KV-cache compression policy that computes cross-attention entropy to dynamically evict non-salient tokens during inference.

1. INTRODUCTION
Context lengths of 128k to 1M tokens require tens of gigabytes of VRAM per request, severely limiting deployment concurrency. Existing static window approaches discard distant context necessary for multi-hop synthesis.

2. COMPRESSION ALGORITHM
AttnSparsify maintains a rolling budget of K tokens. At each decoding step, tokens with cumulative attention weight below percentile rho=0.05 across all heads are evicted, while protecting initial prefix anchor tokens (p=16). A low-rank quantized buffer stores evicted historical summaries.

3. BENCHMARK RESULTS
Evaluated on RULER (128k context) and BABILong:
- Needle-in-a-Haystack retention: 99.1% at 4x compression ratio.
- GPU VRAM savings: 73.4% reduction on NVIDIA H100 80GB clusters.
- Inference throughput increased from 14.2 tokens/sec to 48.9 tokens/sec for concurrent batch sizes of 16.

4. LIMITATIONS
Slight degradation is observed on needle tasks where key information is purely numeric without contextual semantic cues. Pruning threshold rho requires hyperparameter tuning across different model families.`,
      entities: {
        primaryTopic: "Systems Optimization & KV-Cache Compression for Long Contexts",
        methodology: "Entropy-Guided Dynamic Token Pruning with Protected Anchor Prefixes and Quantized Summary Buffers",
        keyFindings: [
          "Maintained 99.1% retrieval accuracy on 128k-token RULER benchmark under 4x compression",
          "Reduced GPU KV-cache VRAM consumption by 73.4% on NVIDIA H100 hardware",
          "Increased multi-user inference throughput from 14.2 to 48.9 tokens/second for batch size 16",
          "Identified that preserving initial 16 anchor tokens prevents catastrophic attention sink collapse"
        ],
        limitations: [
          "Marginal degradation on isolated numerical key retrieval lacking semantic context",
          "Pruning threshold requires per-model calibration across Llama and Gemma architectures",
          "Minor CPU-GPU synchronization latency if token eviction logic is not fully fused in CUDA kernels"
        ],
        datasetsUsed: ["RULER 128K Benchmark", "BABILong Multi-hop Question Answering", "L-Eval Long Context"],
        citationsReferenced: [
          "Xiao et al. (2023) Efficient Streaming Language Models with Attention Sinks",
          "Ge et al. (2023) Model Tells You What to Discard: Adaptive KV Cache Compression",
          "Dao et al. (2022) FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness"
        ]
      }
    },
    {
      id: "doc_seed_004",
      title: "Constitutional Feedback Loops for Autonomous Agent Guardrails",
      fileName: "constitutional_agent_guardrails.pdf",
      fileType: "application/pdf",
      fileSize: 1048576 * 1.5,
      summary: "This work investigates self-correcting alignment frameworks for autonomous software development agents, achieving a 99.4% safety compliance score without degrading reasoning capability.",
      content: `ABSTRACT:
Autonomous coding agents operating with shell access and file editing capabilities pose critical risks of accidental system corruption or unauthorized network egress. We formulate Constitutional Agent Loops (CAL), an inline critique-and-refinement protocol that evaluates proposed agent actions against formal safety principles before tool invocation.

1. THREAT MODEL & SCOPE
Agents equipped with terminal tools can execute destructive commands (e.g. recursive deletions, privilege escalations, leakage of API keys). Traditional post-hoc output filters cannot prevent executing irreversible shell actions.

2. ARCHITECTURE
CAL enforces a two-tier deliberation architecture: (i) Action Proposer Agent generates candidate tool invocations; (ii) Critic Agent checks tool arguments against 16 immutable safety invariants. If violation is detected, an execution veto is issued with actionable feedback for immediate trajectory self-correction.

3. EMPIRICAL FINDINGS
In a testbed of 2,500 adversarial scenarios (CVE-derived exploits, accidental data wipe prompts, credential exfiltration):
- Zero-day exploit prevention rate: 99.4%
- False rejection rate on legitimate complex tasks: 1.8%
- Latency overhead: 120ms median via speculative parallel critique.

4. LIMITATIONS
Adversarial prompt injection attacks designed with nested multi-lingual indirection occasionally bypass the critic agent. Does not cover physical or biometric execution vectors.`,
      entities: {
        primaryTopic: "AI Alignment, Agent Safety Guardrails & Tool Invocations",
        methodology: "Dual-Tier Proposer-Critic Architecture with 16 Immutable Safety Invariants and Speculative Inline Deliberation",
        keyFindings: [
          "Achieved 99.4% prevention rate against adversarial tool execution and credential exfiltration",
          "Kept false rejection rate on legitimate developer tasks down to 1.8%",
          "Speculative parallel execution kept latency overhead to 120ms median",
          "Demonstrated that separating generation from safety critique eliminates goal-conflict hallucinations"
        ],
        limitations: [
          "Vulnerable to complex multi-turn nested multi-lingual jailbreaks",
          "Relies on the critic model having sufficient reasoning capacity (lightweight 1B models fail to detect subtle attacks)",
          "Cannot infer ambient state changes caused by external network dependencies"
        ],
        datasetsUsed: ["AgentSafetyBench-2025", "CVE-Adversarial-Corpus", "SWE-bench Verified"],
        citationsReferenced: [
          "Bai et al. (2022) Constitutional AI: Harmlessness from AI Feedback",
          "Shinn et al. (2023) Reflexion: Language Agents with Verbal Reinforcement Learning",
          "Ruan et al. (2023) Identifying and Mitigating Vulnerabilities in Autonomous Code Agents"
        ]
      }
    }
  ];

  for (const paper of samplePapers) {
    query(
      `INSERT INTO documents (
        id, workspace_id, user_id, title, file_name, file_path, file_type, file_size_bytes, raw_content, summary, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        paper.id,
        demoWorkspaceId,
        demoUserId,
        paper.title,
        paper.fileName,
        `uploads/${paper.fileName}`,
        paper.fileType,
        paper.fileSize,
        paper.content,
        paper.summary,
        "COMPLETED"
      ]
    );

    query(
      `INSERT INTO document_entities (
        id, document_id, primary_topic, methodology, key_findings, limitations, datasets_used, citations_referenced, raw_ai_metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        generateUUID(),
        paper.id,
        paper.entities.primaryTopic,
        paper.entities.methodology,
        JSON.stringify(paper.entities.keyFindings),
        JSON.stringify(paper.entities.limitations),
        JSON.stringify(paper.entities.datasetsUsed),
        JSON.stringify(paper.entities.citationsReferenced),
        JSON.stringify({ model: "gemini-3.8-flash", parsedAt: new Date().toISOString() })
      ]
    );
  }

  // Pre-seed an initial synthesis report for instant viewing
  const seedReportId = "rep_seed_lit_review_001";
  const seedSynthesisContent = {
    title: "Systematic Literature Synthesis: Advancing Scalable Reasoning, Efficiency, and Safety in Modern Foundation Models",
    executiveSummary: "This synthesis reviews four foundational papers addressing the tripartite bottleneck of frontier AI systems: algorithmic reasoning veracity, extreme long-context inference memory, and autonomous agent safety. Cross-analysis demonstrates a profound paradigm shift: state-of-the-art architectures are transitioning away from unconstrained autoregressive greedy decoding toward verifiable test-time search (LTS), mechanistic sparsity (TopK SAEs), and dynamic KV-cache eviction (AttnSparsify). While reasoning accuracy improves by +11.2% and VRAM footprints diminish by 73.4%, challenges remain regarding out-of-domain value heuristics and subtle multi-turn prompt injections.",
    comparativeAnalysis: [
      {
        theme: "Inference-Time Compute & Optimization",
        consensus: "All papers agree that standard greedy next-token prediction is insufficient for complex multi-step tasks, and that allocating structured compute (either through latent search trees or attention-entropy filtering) yields disproportionate quality gains.",
        contradictions: "LTS argues for expanding test-time compute depth to achieve verification, whereas AttnSparsify advocates aggressive pruning of context states to conserve memory. Balancing search breadth against KV-cache limits is an unresolved tension.",
        supportingDocIds: ["doc_seed_001", "doc_seed_003"]
      },
      {
        theme: "Interpretability & Internal Circuit Isolation",
        consensus: "Superposition in dense models can be successfully untangled into monosemantic circuits using dictionary learning (SAEs), revealing that in-context learning is governed by discrete induction heads.",
        contradictions: "While mechanistic interpretability claims complete circuit monosemanticity, agent alignment research notes that external multi-lingual prompt injections can still deceive internal critic heads, highlighting an empirical gap between synthetic tests and wild deployment.",
        supportingDocIds: ["doc_seed_002", "doc_seed_004"]
      },
      {
        theme: "Verification and Autonomous Guardrails",
        consensus: "Relying purely on soft probabilistic LLM likelihoods leads to hallucinations and safety failures. Hard external sandboxes (Lean4/Python) and inline Proposer-Critic architectures are essential for reliable autonomous execution.",
        contradictions: "Deterministic execution verifiers cannot be readily applied to non-formal subjective or creative prompts, where safety critic rules risk elevated false-rejection rates.",
        supportingDocIds: ["doc_seed_001", "doc_seed_004"]
      }
    ],
    researchGaps: [
      "Unified co-design of test-time latent tree search with compressed dynamic KV-cache memory structures",
      "Formal verification mechanisms for continuous and qualitative human values beyond deterministic code sandboxes",
      "Real-time mechanistic circuit intervention during live adversarial prompt injection attacks"
    ],
    futureDirections: [
      "End-to-end integration of TopK Sparse Autoencoders directly into test-time search value functions",
      "Hardware-fused CUDA kernels for simultaneous attention entropy eviction and speculative safety critiquing",
      "Multi-agent verification federations with cross-domain Lean4 formal proof generators"
    ],
    metadata: {
      citationStyle: "APA7",
      targetAudience: "Peer Reviewer & Lead Architect",
      generatedWith: "gemini-3.8-flash"
    }
  };

  query(
    `INSERT INTO synthesis_reports (
      id, workspace_id, user_id, title, document_ids, report_type, content_json
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      seedReportId,
      demoWorkspaceId,
      demoUserId,
      seedSynthesisContent.title,
      JSON.stringify(["doc_seed_001", "doc_seed_002", "doc_seed_003", "doc_seed_004"]),
      "LITERATURE_REVIEW",
      JSON.stringify(seedSynthesisContent)
    ]
  );

  // Pre-seed a chat session
  const seedChatSessionId = "chat_seed_session_001";
  query(
    `INSERT INTO chat_sessions (id, workspace_id, user_id, title) VALUES ($1, $2, $3, $4)`,
    [seedChatSessionId, demoWorkspaceId, demoUserId, "Verification Architecture & Cache Overhead"]
  );

  query(
    `INSERT INTO chat_messages (id, session_id, sender, message, sources) VALUES ($1, $2, $3, $4, $5)`,
    [
      generateUUID(),
      seedChatSessionId,
      "USER",
      "How does Latent Tree Search compare with AttnSparsify in terms of memory overhead and reasoning throughput?",
      JSON.stringify([])
    ]
  );

  query(
    `INSERT INTO chat_messages (id, session_id, sender, message, sources) VALUES ($1, $2, $3, $4, $5)`,
    [
      generateUUID(),
      seedChatSessionId,
      "ASSISTANT",
      "Based on the analyzed literature:\n\n1. **Memory Complexity**: **Latent Tree Search (LTS)** models reasoning within a 768-dimensional latent state manifold, which amortizes token-space branching. However, it still encounters elevated VRAM requirements when tree expansion depth exceeds 12 nodes [Doc: Self-Refining Latent Tree Search, Section 4]. In contrast, **AttnSparsify** targets KV-cache memory directly by evicting tokens with cumulative attention weights below the 5th percentile, achieving a **73.4% reduction in VRAM** on H100 clusters while preserving 99.1% retrieval fidelity [Doc: Dynamic Token Pruning and KV-Cache Compression, Section 3].\n\n2. **Throughput Impact**: While LTS achieves a **3.4x speedup** over conventional token-level Beam Search by pruning low-confidence branches early (theta < 0.72), AttnSparsify boosts serving throughput from 14.2 to **48.9 tokens/sec** under batch size 16 by eliminating KV-cache I/O bottlenecks.\n\n3. **Complementary Potential**: The two approaches operate on orthogonal layers: LTS operates at the algorithmic planning level, while AttnSparsify optimizes hardware memory tensors.",
      JSON.stringify([
        {
          docId: "doc_seed_001",
          title: "Self-Refining Latent Tree Search for Multi-Step Algorithmic Verification",
          snippet: "On MATH500, LTS achieves 89.4% accuracy... Latency is amortized via branch pruning, yielding a 3.4x speedup... High GPU memory footprint is observed during depth > 12 tree expansions."
        },
        {
          docId: "doc_seed_003",
          title: "Dynamic Token Pruning and KV-Cache Compression for Infinite Context Windows",
          snippet: "AttnSparsify maintains a rolling budget... GPU VRAM savings: 73.4% reduction... Inference throughput increased from 14.2 tokens/sec to 48.9 tokens/sec."
        }
      ])
    ]
  );

  console.log("[OmniResearch AI] Seed data created successfully with 4 research papers and initial synthesis report.");
}
