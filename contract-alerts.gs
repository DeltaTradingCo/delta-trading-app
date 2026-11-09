/**
 * Delta Trading Co. — تنبيه انتهاء العقود بالبريد
 * يعمل يومياً على حساب deltatradingco.eg@gmail.com (Google Apps Script)
 * يرسل إيميل عندما يتبقى على انتهاء العقد 60 يوم، ثم تذكير عند 30 و 7 أيام.
 * طريقة التركيب في README (قسم: تنبيه انتهاء العقود بالبريد).
 */
const PROJECT_ID = 'delta-trading-5294f';
const NOTIFY_TO  = 'deltatradingco.eg@gmail.com';   // يمكن إضافة أكثر من بريد مفصولة بفاصلة
const APP_URL    = 'https://deltatradingco.github.io/delta-trading-app/';
const STAGES     = [60, 30, 7];                     // أيام قبل الانتهاء

function checkContracts() {
  const contracts = readCollection_('contracts');
  const clients = {};
  readCollection_('clients').forEach(c => clients[c.id] = c);
  const props = PropertiesService.getScriptProperties();
  const today = new Date(Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyy-MM-dd') + 'T00:00:00');
  const due = [];

  contracts.forEach(k => {
    if (!k.end || k.status === 'ملغي' || k.status === 'معلق') return;
    const end = new Date(k.end + 'T00:00:00');
    const left = Math.round((end - today) / 864e5);
    if (left < 0) return;                                         // منتهي بالفعل
    const stage = STAGES.filter(s => left <= s).pop();            // أصغر مرحلة وصل لها
    if (stage === undefined) return;
    const key = k.id + '_' + k.end + '_' + stage;
    if (props.getProperty(key)) return;                           // تم الإرسال لهذه المرحلة
    due.push({ k, c: clients[k.clientId] || {}, left, key });
  });

  if (!due.length) return;
  due.sort((a, b) => a.left - b.left);
  const rows = due.map(d =>
    `<tr><td style="padding:6px 10px;border:1px solid #ddd"><b>${esc_(d.c.name)}</b><br><span style="color:#777">${esc_(d.c.ref)}</span></td>` +
    `<td style="padding:6px 10px;border:1px solid #ddd;direction:ltr">${esc_(d.k.no)}</td>` +
    `<td style="padding:6px 10px;border:1px solid #ddd">${esc_(d.k.title)}</td>` +
    `<td style="padding:6px 10px;border:1px solid #ddd">${fmt_(d.k.end)}</td>` +
    `<td style="padding:6px 10px;border:1px solid #ddd;color:${d.left <= 30 ? '#d64545' : '#c98a06'}"><b>${d.left} يوم</b></td>` +
    `<td style="padding:6px 10px;border:1px solid #ddd">${d.k.value ? Number(d.k.value).toLocaleString('en-US') + ' ج.م' : '—'}</td></tr>`).join('');
  const html =
    `<div dir="rtl" style="font-family:Tahoma,Arial;font-size:14px;color:#1d2235">` +
    `<h2 style="color:#161A3C;border-bottom:3px solid #6BAB20;padding-bottom:6px">⏰ عقود تقترب من الانتهاء</h2>` +
    `<p>العقود التالية تنتهي خلال ${STAGES[0]} يوم أو أقل — برجاء التواصل مع العملاء للتجديد:</p>` +
    `<table style="border-collapse:collapse;font-size:13px"><tr style="background:#f4f6f9">` +
    `<th style="padding:6px 10px;border:1px solid #ddd">العميل</th><th style="padding:6px 10px;border:1px solid #ddd">رقم العقد</th>` +
    `<th style="padding:6px 10px;border:1px solid #ddd">الموضوع</th><th style="padding:6px 10px;border:1px solid #ddd">تاريخ الانتهاء</th>` +
    `<th style="padding:6px 10px;border:1px solid #ddd">المتبقي</th><th style="padding:6px 10px;border:1px solid #ddd">القيمة</th></tr>${rows}</table>` +
    `<p><a href="${APP_URL}#/contracts" style="background:#6BAB20;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none">فتح العقود في البرنامج</a></p>` +
    `<p style="color:#888;font-size:12px">Delta Trading Co. — تنبيه تلقائي</p></div>`;
  MailApp.sendEmail({
    to: NOTIFY_TO,
    subject: `⏰ ${due.length} عقد يقترب من الانتهاء — أقربها ${due[0].c.name || ''} (باقي ${due[0].left} يوم)`,
    htmlBody: html,
    name: 'Delta Trading Co.'
  });
  due.forEach(d => props.setProperty(d.key, new Date().toISOString()));
}

/** تشغيل مرة واحدة: ينشئ التشغيل اليومي الساعة 9 صباحاً */
function setupDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('checkContracts').timeBased().everyDays(1).atHour(9).inTimezone('Africa/Cairo').create();
  checkContracts();
}

/* ---------- helpers ---------- */
function readCollection_(name) {
  const out = []; let page = '';
  do {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${name}?pageSize=300` + (page ? '&pageToken=' + page : '');
    const res = UrlFetchApp.fetch(url, { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error(name + ': ' + res.getContentText());
    const json = JSON.parse(res.getContentText());
    (json.documents || []).forEach(d => out.push(fields_(d.fields || {})));
    page = json.nextPageToken || '';
  } while (page);
  return out;
}
function fields_(f) {
  const o = {};
  Object.keys(f).forEach(k => {
    const v = f[k];
    o[k] = 'stringValue' in v ? v.stringValue : 'integerValue' in v ? Number(v.integerValue) : 'doubleValue' in v ? v.doubleValue :
           'booleanValue' in v ? v.booleanValue : 'nullValue' in v ? null : 'mapValue' in v ? fields_(v.mapValue.fields || {}) : '';
  });
  return o;
}
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function fmt_(d) { return d ? d.split('-').reverse().join('/') : ''; }
