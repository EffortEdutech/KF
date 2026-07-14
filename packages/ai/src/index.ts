export type ModelRouterRequest = {
  capability: "summarization" | "extraction" | "classification" | "relationship_suggestion" | "drafting";
  prompt: string;
  context?: string;
};

export type ModelRouterResponse = {
  provider: "fake" | "ollama";
  content: string;
  evidence: string[];
  uncertainty: string | null;
};

export interface ModelProvider {
  name: "fake" | "ollama";
  generate(request: ModelRouterRequest): Promise<ModelRouterResponse>;
}

export class FakeModelProvider implements ModelProvider {
  name = "fake" as const;

  async generate(request: ModelRouterRequest): Promise<ModelRouterResponse> {
    return {
      provider: this.name,
      content: `Deterministic ${request.capability} draft for: ${request.prompt}`,
      evidence: request.context ? [request.context] : [],
      uncertainty: "Fake provider output is for tests and local scaffolding only."
    };
  }
}
