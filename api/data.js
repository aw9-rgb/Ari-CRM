const { getData, setData } = require('../lib/db');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const data = await getData();
    res.status(200).json(data);
    return;
  }
  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { body = {}; }
    }
    const current = await getData();
    const next = {
      contacts: body.contacts !== undefined ? body.contacts : current.contacts,
      tasks: body.tasks !== undefined ? body.tasks : current.tasks,
      history: body.history !== undefined ? body.history : current.history,
      pipeline: body.pipeline !== undefined ? body.pipeline : current.pipeline,
      links: body.links !== undefined ? body.links : current.links
    };
    await setData(next);
    res.status(200).json({ ok: true });
    return;
  }
  res.status(405).json({ error: 'method not allowed' });
};
