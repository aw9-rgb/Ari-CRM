const { kv } = require('@vercel/kv');

const DATA_KEY = 'crm:data';
const SUB_KEY = 'crm:subscriptions';

async function getData() {
  const data = await kv.get(DATA_KEY);
  return data || { contacts: [], tasks: [], history: [] };
}

async function setData(data) {
  await kv.set(DATA_KEY, data);
}

// Multiple devices can each register a push subscription. We keep them as a
// list keyed by endpoint so both an iPhone and a Mac (etc.) get notified.
async function getSubscriptions() {
  const subs = await kv.get(SUB_KEY);
  return Array.isArray(subs) ? subs : [];
}

async function addSubscription(sub) {
  const subs = await getSubscriptions();
  const exists = subs.some(s => s.endpoint === sub.endpoint);
  if (!exists) {
    subs.push(sub);
    await kv.set(SUB_KEY, subs);
  }
}

async function removeSubscription(endpoint) {
  const subs = await getSubscriptions();
  const next = subs.filter(s => s.endpoint !== endpoint);
  if (next.length !== subs.length) {
    await kv.set(SUB_KEY, next);
  }
}

module.exports = { getData, setData, getSubscriptions, addSubscription, removeSubscription };
