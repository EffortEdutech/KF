export type KfRuntimeConfig = {
  storageRoot: string;
  aiProvider: "fake" | "ollama";
  ollamaBaseUrl: string;
  ollamaModel: string;
  localOrgId: string;
  localWorkspaceId: string;
  localUserEmail: string;
};

export function getRuntimeConfig(env: NodeJS.ProcessEnv = process.env): KfRuntimeConfig {
  return {
    storageRoot: env.KF_STORAGE_ROOT ?? "./storage",
    aiProvider: env.KF_AI_PROVIDER === "ollama" ? "ollama" : "fake",
    ollamaBaseUrl: env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    ollamaModel: env.OLLAMA_MODEL ?? "qwen2.5:7b",
    localOrgId: env.KF_LOCAL_ORG_ID ?? "local-org",
    localWorkspaceId: env.KF_LOCAL_WORKSPACE_ID ?? "local-workspace",
    localUserEmail: env.KF_LOCAL_USER_EMAIL ?? "admin@kf.local"
  };
}
