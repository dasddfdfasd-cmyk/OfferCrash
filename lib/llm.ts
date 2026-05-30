interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
}

function buildProviderOptions(baseUrl: string) {
  if (!baseUrl.includes("aiping.cn")) {
    return {};
  }

  return {
    enable_thinking: false,
    provider: {
      only: [],
      order: [],
      sort: null,
      input_price_range: [],
      output_price_range: [],
      input_length_range: [],
      output_length_range: [],
      throughput_range: [],
      latency_range: [],
    },
  };
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export async function callTextModel(prompt: string): Promise<string> {
  const apiKey = requireEnv("TEXT_MODEL_API_KEY");
  const baseUrl = requireEnv("TEXT_MODEL_BASE_URL");
  const modelName = requireEnv("TEXT_MODEL_NAME");

  const endpoint = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      ...buildProviderOptions(baseUrl),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Text model request failed with status ${response.status}${
        errorText ? `: ${errorText.slice(0, 500)}` : ""
      }`,
    );
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("Text model returned empty assistant content");
  }

  return content;
}
