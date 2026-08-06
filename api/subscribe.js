const { addSubscription } = require('../lib/db');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = null; }
  }
  if (!body || !body.endpoint) {
    res.status(400).json({ error: 'invalid subscription' });
    return;
  }
  await addSubscription(body);
  res.status(200).json({ ok: true });
};
