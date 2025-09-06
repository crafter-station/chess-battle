import Image from "next/image";

// Provider logos map (company before the slash)
const PROVIDER_LOGOS = {
  alibaba: "https://avatars.githubusercontent.com/u/137491736?s=200&v=4", // Qwen
  anthropic: "https://avatars.githubusercontent.com/u/46360699?s=200&v=4", // Claude
  openai: "https://avatars.githubusercontent.com/u/14957082?s=200&v=4", // OpenAI
  cohere: "https://avatars.githubusercontent.com/u/29539506?s=200&v=4", // Cohere
  xai: "https://avatars.githubusercontent.com/u/150673994?s=200&v=4", // xAI/Grok
  google: "https://avatars.githubusercontent.com/u/1342004?s=200&v=4", // Google/Gemini
  deepseek: "https://avatars.githubusercontent.com/u/139544350?s=200&v=4", // DeepSeek
  moonshotai: "https://avatars.githubusercontent.com/u/126165481?s=200&v=4", // Moonshot/Kimi
} as const;

interface ModelIconProps {
  modelId?: string | null;
  allModels?: Array<{
    canonical_id: string;
    name?: string | null;
    logo_url?: string | null;
  }> | null;
  isWhite?: boolean;
}

export function ModelIcon({
  modelId,
  allModels,
  isWhite = true,
}: ModelIconProps) {
  const model = allModels?.find((m) => m.canonical_id === modelId);

  // Use model's logo_url first (same as ModelSelect)
  if (model?.logo_url) {
    return (
      <Image
        src={model.logo_url}
        alt={model.name || model.canonical_id}
        width={24}
        height={24}
        className="w-6 h-6 rounded shrink-0 object-cover"
        onError={(e) => {
          console.log(`❌ Logo failed for "${modelId}": ${model.logo_url}`);
          // Hide the broken image
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  // Fallback to provider logos if no model logo_url
  const provider = modelId?.split("/")[0] as keyof typeof PROVIDER_LOGOS;
  const providerLogo = provider ? PROVIDER_LOGOS[provider] : null;

  if (providerLogo) {
    return (
      <Image
        src={providerLogo}
        alt={provider || "AI Model"}
        width={24}
        height={24}
        className="w-6 h-6 rounded shrink-0 object-cover"
        onError={(e) => {
          console.log(
            `❌ Provider logo failed for "${modelId}": ${providerLogo}`,
          );
          // Hide the broken image
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  // Final fallback to chess pieces
  return (
    <div
      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
        isWhite
          ? "bg-white/10 border-white/20"
          : "bg-gray-800/40 border-gray-600/20"
      }`}
    >
      <span className="text-sm">{isWhite ? "♔" : "♛"}</span>
    </div>
  );
}
