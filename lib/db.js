const { kv } = require('@vercel/kv');

const DATA_KEY = 'crm:data';
const SUB_KEY = 'crm:subscription';

async function getData() {
  const data = await kv.get(DATA_KEY);
  return data || { contacts: [], tasks: [], history: [] };
}

async function setData(data) {
  await kv.set(DATA_KEY, data);
}

async function getSubscription() {
  return await kv.get(SUB_KEY);
}

async function setSubscription(sub) {
  await kv.set(SUB_KEY, sub);
}

module.exports = { getData, setData, getSubscription, setSubscription };
