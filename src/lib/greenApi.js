function greenApiBase() {
  const instanceId = process.env.GREEN_API_INSTANCE_ID?.trim();
  const token = process.env.GREEN_API_TOKEN?.trim();
  const apiUrl = (process.env.GREEN_API_URL?.trim() || 'https://api.green-api.com').replace(/\/$/, '');

  if (!instanceId || !token) {
    throw new Error('Green API: set GREEN_API_INSTANCE_ID and GREEN_API_TOKEN');
  }

  return { instanceId, token, apiUrl };
}

/** @returns {Promise<{ id: string, name?: string, type?: string }[]>} */
export async function fetchGreenApiChats() {
  const { instanceId, token, apiUrl } = greenApiBase();
  const url = `${apiUrl}/waInstance${instanceId}/getChats/${token}`;
  const res = await fetch(url);
  const body = await res.text();

  if (!res.ok) {
    throw new Error(`getChats HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error(`getChats invalid JSON: ${body.slice(0, 300)}`);
  }

  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.chats)) return parsed.chats;
  return [];
}

function normalizeName(s) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** @param {{ id: string, name?: string }[]} chats */
export function findChatByName(chats, groupName) {
  const needle = normalizeName(groupName);
  const exact = chats.find((c) => c.name && normalizeName(c.name) === needle);
  if (exact) return exact;

  return chats.find((c) => c.name && normalizeName(c.name).includes(needle));
}

export async function resolveGreenApiChatId() {
  const direct = process.env.WHATSAPP_CHAT_ID?.trim();
  if (direct) return direct;

  const groupName = process.env.WHATSAPP_GROUP_NAME?.trim();
  if (!groupName) {
    throw new Error('Set WHATSAPP_CHAT_ID or WHATSAPP_GROUP_NAME (e.g. Ether Alumni)');
  }

  const chats = await fetchGreenApiChats();
  const match = findChatByName(chats, groupName);
  if (!match?.id) {
    const names = chats
      .filter((c) => c.id?.endsWith('@g.us'))
      .map((c) => c.name || c.id)
      .slice(0, 20);
    throw new Error(
      `Group "${groupName}" not found. Groups seen: ${names.join(', ') || '(none)'}`
    );
  }

  return match.id;
}

export async function sendGreenApiMessage(text) {
  const chatId = await resolveGreenApiChatId();
  const { instanceId, token, apiUrl } = greenApiBase();
  const url = `${apiUrl}/waInstance${instanceId}/sendMessage/${token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, message: text }),
  });

  const body = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = { raw: body };
  }

  if (!res.ok) {
    throw new Error(`Green API HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  return {
    chatId,
    id: parsed?.idMessage,
    response: parsed,
  };
}
