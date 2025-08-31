import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatModelName(modelId: string): string {
  // Handle empty or undefined model IDs
  if (!modelId) return "Unknown Model";

  // Split provider and model name
  const parts = modelId.split("/");
  if (parts.length !== 2) return modelId;

  const [provider, model] = parts;

  // Provider mappings for cleaner display
  const providerNames: Record<string, string> = {
    anthropic: "Claude",
    openai: "GPT",
    google: "Gemini",
    meta: "Llama",
    mistral: "Mistral",
    deepseek: "DeepSeek",
    xai: "Grok",
    amazon: "Nova",
    cohere: "Cohere",
    perplexity: "Sonar",
    alibaba: "Qwen",
    moonshotai: "Kimi",
    morph: "Morph",
    vercel: "Vercel",
    inception: "Inception",
    zai: "GLM",
  };

  const displayProvider = providerNames[provider] || provider;

  // Clean up model names
  let displayModel = model
    .replace(/^claude-?/, "") // Remove claude- prefix
    .replace(/^gpt-?/, "") // Remove gpt- prefix
    .replace(/^gemini-?/, "") // Remove gemini- prefix
    .replace(/^llama-?/, "") // Remove llama- prefix
    .replace(/^deepseek-?/, "") // Remove deepseek- prefix
    .replace(/-?instruct$/, "") // Remove -instruct suffix
    .replace(/-?base$/, "") // Remove -base suffix
    .replace(/-?fast$/, "") // Remove -fast suffix
    .replace(/-?lite$/, " Lite") // Replace -lite with " Lite"
    .replace(/-?mini$/, " Mini") // Replace -mini with " Mini"
    .replace(/-?nano$/, " Nano") // Replace -nano with " Nano"
    .replace(/-?pro$/, " Pro") // Replace -pro with " Pro"
    .replace(/-?turbo$/, " Turbo") // Replace -turbo with " Turbo"
    .replace(/-?flash$/, " Flash") // Replace -flash with " Flash"
    .replace(/-?sonnet$/, " Sonnet") // Replace -sonnet with " Sonnet"
    .replace(/-?haiku$/, " Haiku") // Replace -haiku with " Haiku"
    .replace(/-?opus$/, " Opus") // Replace -opus with " Opus"
    .replace(/^\d+\.?\d*/, (match) => match) // Keep version numbers
    .replace(/-/g, " ") // Replace remaining dashes with spaces
    .trim();

  // Capitalize first letter of each word
  displayModel = displayModel.replace(/\b\w/g, (l) => l.toUpperCase());

  // Combine provider and model
  return `${displayProvider} ${displayModel}`;
}

export function formatDate(date: Date | string): string {
  const dateObj =
    typeof date === "string"
      ? date.endsWith("Z")
        ? new Date(date)
        : new Date(`${date}Z`)
      : date;
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
