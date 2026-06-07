import { ModelProvider } from "../types.js";

export const DeepSeek: ModelProvider = {
  id: "deepseek",
  displayName: "DeepSeek",
  models: [
    {
      model: "deepseek-v4-flash",
      displayName: "DeepSeek V4 Flash",
      contextLength: 128000,
      maxCompletionTokens: 8000,
      recommendedFor: ["chat", "autocomplete"],
    },
    {
      model: "deepseek-v4-pro",
      displayName: "DeepSeek V4 Pro",
      contextLength: 128000,
      maxCompletionTokens: 8000,
      recommendedFor: ["chat"],
    },
    {
      model: "deepseek-chat",
      displayName: "DeepSeek Chat",
      contextLength: 128000,
      maxCompletionTokens: 8000,
      recommendedFor: ["chat"],
    },
    {
      model: "deepseek-reasoner",
      displayName: "DeepSeek Reasoner",
      contextLength: 128000,
      maxCompletionTokens: 8000,
      recommendedFor: ["chat"],
    },
  ],
};
