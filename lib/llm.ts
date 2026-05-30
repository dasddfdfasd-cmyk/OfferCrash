interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export async function callTextModel(prompt: string): Promise<string> {
  const apiKey = process.env.TEXT_MODEL_API_KEY;
  const baseUrl = process.env.TEXT_MODEL_BASE_URL;
  const modelName = process.env.TEXT_MODEL_NAME;

  if (!apiKey || !baseUrl || !modelName) {
    throw new Error(
      "缺少文本模型环境变量：TEXT_MODEL_API_KEY、TEXT_MODEL_BASE_URL 或 TEXT_MODEL_NAME",
    );
  }

  const endpoint = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    throw new Error(`文本模型调用失败：${response.status}`);
  }

  const data = (await response.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("文本模型返回为空");
  }

  return content;
}
