/**
 * List Green API WhatsApp groups — find chat ID for EtherTech etc.
 * Set GREEN_API_* in .env.local or export, then: npm run whatsapp:chats
 */
import { loadOptionalEnvFiles } from './loadEnv.mjs';
import { fetchGreenApiChats, findChatByName } from '../src/lib/greenApi.js';

loadOptionalEnvFiles();

const filter = process.argv[2]?.trim();

try {
  const chats = await fetchGreenApiChats();
  const groups = chats.filter((c) => c.id?.endsWith('@g.us'));

  if (!groups.length) {
    console.log('No groups found. Add the Green API number to your WhatsApp group first.');
    process.exit(0);
  }

  console.log(`Found ${groups.length} group(s):\n`);
  for (const g of groups) {
    console.log(`  ${g.name || '(no name)'}`);
    console.log(`    chatId: ${g.id}\n`);
  }

  if (filter) {
    const match = findChatByName(groups, filter);
    if (match) {
      console.log(`Match for "${filter}":`);
      console.log(`  WHATSAPP_CHAT_ID=${match.id}`);
    } else {
      console.log(`No match for "${filter}".`);
    }
  } else {
    console.log('Tip: npm run whatsapp:chats -- "EtherTech"');
  }
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
