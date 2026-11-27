import type {
  ChatCompletionRequest,
  StreamChunk,
  ModelSpec,
  TelemetryMetrics, ResearchEvent, WebCitation
} from '@orf/core';

export interface OrfClientOptions {
  baseUrl?: string;
  apiKey?: string;
}

export class OrfClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(options: OrfClientOptions = {}) {
    this.baseUrl = (options.baseUrl || 'https://orf.zztt.org/api').replace(/\/$/, '');
    this.apiKey = options.apiKey;
  }

  public readonly chat = {
    complete: async (request: ChatCompletionRequest): Promise<{ content: string; telemetry?: TelemetryMetrics; runId?: string; events?: ResearchEvent[]; citations?: WebCitation[]; executionMode?: string }> => {
      const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        signal: request.signal,
        body: JSON.stringify({ ...request, stream: false })
      });
      if (!res.ok) throw new Error(`ORF chat failed with status ${res.status}: ${await res.text()}`);
      return await res.json();
    },

    stream: async (
      request: ChatCompletionRequest,
      onChunk: (chunk: StreamChunk) => void
    ): Promise<TelemetryMetrics | undefined> => {
      const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        signal: request.signal,
        body: JSON.stringify({ ...request, stream: true })
      });

      if (!res.ok) throw new Error(`ORF stream failed: ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No readable stream available in response');

      const decoder = new TextDecoder();
      let buffer = '';
      let finalTelemetry: TelemetryMetrics | undefined;

      let completed = false;
      const consume = (line: string) => {
        if (!line.startsWith('data:')) return;
        const value = line.slice(5).trim();
        if (value === '[DONE]') { completed = true; return; }
        const chunk: StreamChunk = JSON.parse(value);
        if (chunk.telemetry) finalTelemetry = chunk.telemetry;
        onChunk(chunk);
      };
      try {
        while (true) {
          const { done, value } = await reader.read(); if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n'); buffer = lines.pop() || '';
          for (const line of lines) if(line.trim()) consume(line.trim());
        }
        buffer += decoder.decode(); if(buffer.trim()) consume(buffer.trim());
        if(!completed) throw new Error('ORF stream ended before completion');
      } finally { reader.releaseLock(); }
      return finalTelemetry;
    }
  };

  /**
   * Musiki Live Room Chat Pod Integration
   */
  public readonly musiki = {
    sendRoomMessage: async (
      roomId: string,
      message: string,
      onDelta?: (delta: string) => void
    ): Promise<{ reply: string; telemetry?: TelemetryMetrics }> => {
      let fullText = '';
      let telemetry: TelemetryMetrics | undefined;

      if (onDelta) {
        telemetry = await this.chat.stream(
          {
            model: 'ollama:deepseek-r1:8b',
            domain: 'musiki-chatpod',
            messages: [
              {
                role: 'system',
                content: `You are the ORF Chat Pod inside the Musiki Live Room (${roomId}). Provide concise, musical, sound-art, and electronic-oriented commentary.`
              },
              { role: 'user', content: message }
            ]
          },
          (chunk) => {
            fullText += chunk.delta;
            onDelta(chunk.delta);
          }
        );
        return { reply: fullText, telemetry };
      } else {
        const res = await this.chat.complete({
          model: 'ollama:deepseek-r1:8b',
          domain: 'musiki-chatpod',
          messages: [{ role: 'user', content: message }]
        });
        return { reply: res.content, telemetry: res.telemetry };
      }
    }
  };

  /**
   * Glip Pedagogic Video Resource Annotator
   */
  public readonly glip = {
    annotateTimestamp: async (
      videoTitle: string,
      timestampSec: number,
      transcriptSegment: string
    ): Promise<{ note: string; pedagogicConcept: string; telemetry?: TelemetryMetrics }> => {
      const res = await this.chat.complete({
        model: 'ollama:deepseek-r1:8b',
        domain: 'glip-annotator',
        messages: [
          {
            role: 'system',
            content: `You are the Glip Pedagogic Annotator. Create an insightful, structured educational micro-note for a video lecture timestamp.`
          },
          {
            role: 'user',
            content: `Video: "${videoTitle}" at ${timestampSec}s.\nTranscript segment: "${transcriptSegment}"\nProvide a concise pedagogical note and the core concept tag.`
          }
        ]
      });

      return {
        note: res.content,
        pedagogicConcept: 'Pedagogical Synthesis',
        telemetry: res.telemetry
      };
    }
  };

  public readonly models = {
    list: async (): Promise<ModelSpec[]> => {
      const res = await fetch(`${this.baseUrl}/v1/models`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch ORF models');
      const data = await res.json();
      return data.models;
    }
  };

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;
    return headers;
  }
}
