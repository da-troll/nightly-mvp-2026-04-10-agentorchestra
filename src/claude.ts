const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export function getApiKey(): string {
  return localStorage.getItem('ao_api_key') || '';
}

export function setApiKey(key: string) {
  localStorage.setItem('ao_api_key', key);
}

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  model = 'gpt-4o-mini',
  apiKey?: string,
): Promise<string> {
  const key = apiKey || getApiKey();
  if (!key) throw new Error('No OpenAI API key configured. Click ⚙ to add your key.');

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.error?.message || `API error ${res.status}`);
  }

  const data = await res.json();
  return (data.choices?.[0]?.message?.content ?? '').trim();
}
