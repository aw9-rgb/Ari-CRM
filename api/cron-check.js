const webpush = require('web-push');
const { getData, getSubscriptions, removeSubscription } = require('../lib/db');

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function formatTime(t) {
  if (!t) return '';
  const [h, min] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + ':' + String(min).padStart(2, '0') + ' ' + period;
}

module.exports = async (req, res) => {
  if (process.env.CRON_SECRET) {
    const auth = req.headers['authorization'] || '';
    if (auth !== 'Bearer ' + process.env.CRON_SECRET) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:you@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const subs = await getSubscriptions();
  if (subs.length === 0) {
    res.status(200).json({ ok: true, sent: false, reason: 'no subscription' });
    return;
  }

  const data = await getData();
  const today = todayStr();
  const dueContacts = (data.contacts || []).filter(c => c.callbackDate && c.callbackDate <= today);
  const dueTasks = (data.tasks || []).filter(t => !t.done && t.date && t.date <= today);

  const count = dueContacts.length + dueTasks.length;
  if (count === 0) {
    res.status(200).json({ ok: true, sent: false, reason: 'nothing due' });
    return;
  }

  let body;
  if (dueContacts.length > 0 && dueTasks.length === 0) {
    body = dueContacts.length === 1
      ? 'Call ' + dueContacts[0].firstName + ' ' + dueContacts[0].lastName + (dueContacts[0].callbackTime ? ' at ' + formatTime(dueContacts[0].callbackTime) : '') + ' today.'
      : dueContacts.length + ' callbacks due today.';
  } else if (dueTasks.length > 0 && dueContacts.length === 0) {
    body = dueTasks.length === 1
      ? dueTasks[0].text + (dueTasks[0].time ? ' at ' + formatTime(dueTasks[0].time) : '')
      : dueTasks.length + ' tasks due today.';
  } else {
    body = dueContacts.length + ' callback' + (dueContacts.length > 1 ? 's' : '') + ' and ' + dueTasks.length + ' task' + (dueTasks.length > 1 ? 's' : '') + ' due today.';
  }

  const payload = JSON.stringify({ title: 'Callback CRM', body });

  let sentCount = 0;
  const errors = [];
  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(sub, payload);
      sentCount++;
    } catch (err) {
      // 404/410 means the browser unsubscribed or the device is gone for good —
      // remove it so future runs don't keep failing on it.
      if (err && (err.statusCode === 404 || err.statusCode === 410)) {
        await removeSubscription(sub.endpoint);
      } else {
        errors.push(String(err));
      }
    }
  }));

  res.status(200).json({ ok: true, sent: sentCount > 0, sentCount, total: subs.length, errors });
};
