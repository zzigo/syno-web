export type ProviderType =
  | 'ollama'
  | 'huggingface'
  | 'deepseek'
  | 'openai'
  | 'anthropic'
  | 'historical'
  | 'custom';

export type AgentDomain =
  | 'musiki-chatpod'
  | 'glip-annotator'
  | 'soog-core'
  | 'arpochat'
  | 'universal-studio'
  | 'web-grounding'
  | 'historical-museum';

export interface WebCitation {
  title?: string;
  url: string;
  snippet: string;
  provider?: string;
  contentKind?: "search-snippet" | "page-extract" | "encyclopedia-extract";
  fetchedAt?: string;
  contentHash?: string;
  extractedChars?: number;
  includedChars?: number;
  fetchError?: string;
}

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

export interface ModelSpec {
  id: string;
  name: string;
  provider: ProviderType;
  family: string;
  description: string;
  tags: string[];
  contextWindow: number;
  pricing: ModelPricing;
  isLocal: boolean;
  isHistorical?: boolean;
}

export interface ServerResourceUsage {
  vramMb?: number;
  cpuPct?: number;
  ramMb?: number;
  gpuUtilizationPct?: number;
}

export interface TelemetryMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  durationMs: number;
  ttftMs: number;
  tokensPerSec: number;
  costUsd: number;
  server?: ServerResourceUsage;
  promptTokenBasis?: "provider" | "estimate";
  completionTokenBasis?: "provider" | "chunks";
  searchDurationMs?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  reasoningContent?: string;
  timestamp?: number;
  meta?: Record<string, unknown>;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  domain?: AgentDomain;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  format?: 'json' | string;
  metadata?: Record<string, unknown>;
  runId?: string;
  seed?: number;
  think?: boolean;
  signal?: AbortSignal;
}

export interface StreamChunk {
  id: string;
  delta: string;
  reasoningDelta?: string;
  isFinished: boolean;
  finishReason?: string | null;
  telemetry?: TelemetryMetrics;
  actions?: OrfAction[];
  citations?: WebCitation[];
  runId?: string;
  event?: ResearchEvent;
  error?: string;
  executionMode?: "live" | "simulation" | "tool";
}

// ==========================================
// MUSIKI & DOMAIN STRUCTURED RESPONSES
// ==========================================

export type OrfMidiEvent = {
  note: number; // 0-127 MIDI note number (e.g. 67 = G4, 60 = C4)
  startMs: number;
  durationMs: number;
  velocity?: number; // 0.0 - 1.0 (or 0-127)
};

export type OrfBoardPoint = {
  action?: 'start' | 'draw' | 'end';
  x: number;
  y: number;
};

export type OrfBoardStroke = {
  color?: string;
  points: OrfBoardPoint[];
};

export type OrfAction =
  | {
      type: 'midi.sequence';
      target: 'hyperpiano' | 'pod';
      events: OrfMidiEvent[];
      tempo?: number;
      explanation?: string;
    }
  | {
      type: 'lilypond.score';
      source: string;
      title?: string;
      renderPreview?: boolean;
      svg?: string;
      error?: string;
    }
  | {
      type: 'notes.write';
      markdown: string;
      title?: string;
      target?: 'course' | 'room' | 'personal';
      mode?: 'append' | 'new-note' | 'replace-selection';
    }
  | {
      type: 'matplotlib.plot';
      code: string;
      title?: string;
      imagePngBase64?: string;
      error?: string;
    }
  | {
      type: 'board.note';
      text: string;
      x: number;
      y: number;
      color?: string;
      size?: 'sm' | 'lg';
      roomId?: string;
    }
  | {
      type: 'board.draw';
      strokes: OrfBoardStroke[];
      roomId?: string;
    }
  | {
      type: 'chat.message';
      markdown: string;
      roomId?: string;
    }
  | {
      type: 'video.annotation';
      timestampSec?: number;
      note: string;
      tags?: string[];
    };

export type OrfCitation = {
  title?: string;
  path: string;
  source: 'course' | 'vault' | 'agent' | 'web';
  url?: string;
};

export interface OrfStructuredResponse {
  summary: string;
  actions: OrfAction[];
  citations?: OrfCitation[];
  warnings?: string[];
}

export interface HistoricalModelRecord {
  id: string;
  title: string;
  year: number;
  authors: string[];
  paperTitle?: string;
  era: 'Symbolic & GOFAI' | 'Early Connectionism & Stats' | 'Embeddings Revolution' | 'Transformer Era';
  tags: string[];
  summary: string;
  pedagogicalPoints: string[];
  benchmarks: {
    name: string;
    description: string;
    metricUnit: string;
  }[];
}

export interface ResearchEvent {
  runId: string;
  sequence: number;
  timestamp: string;
  stage: 'run' | 'search' | 'fetch' | 'extract' | 'context' | 'model' | 'tool' | 'training';
  status: 'started' | 'completed' | 'failed' | 'empty' | 'skipped' | 'cancelled';
  message: string;
  provider?: string;
  url?: string;
  durationMs?: number;
  httpStatus?: number;
  data?: Record<string, unknown>;
}
export interface SearchProviderState {
  id: string;
  label: string;
  configured: boolean;
  state: 'unconfigured' | 'untested' | 'searching' | 'ok' | 'empty' | 'error';
  lastChecked?: string;
  durationMs?: number;
  resultCount?: number;
  httpStatus?: number;
  error?: string;
}
