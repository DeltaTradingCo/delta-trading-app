/**
 * Delta Trading Co. — تنبيه انتهاء العقود بالبريد
 * يعمل يومياً على حساب deltatradingco.eg@gmail.com (Google Apps Script)
 * يرسل إيميل عندما يتبقى 60 يوم على "موعد القرار" ثم تذكير عند 30 و 7 أيام.
 * موعد القرار = آخر موعد للإخطار (نهاية الفترة الحالية − مدة الإخطار) أو تاريخ الانتهاء لو مفيش إخطار.
 * العقود ذات التجديد التلقائي تُحسب على نهاية فترتها الحالية.
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
  const prices = {};
  readCollection_('contractPrices').forEach(p => prices[p.id] = p);
  contracts.forEach(k => { const p = prices[k.id]; if (p) ['value', 'payment', 'renewPricing', 'renewIncrease'].forEach(f => { if (f in p) k[f] = p[f]; }); });
  const props = PropertiesService.getScriptProperties();
  const today = new Date(Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyy-MM-dd') + 'T00:00:00');
  const due = [];

  const todayStr = Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyy-MM-dd');
  contracts.forEach(k => {
    if (!k.end || k.status === 'ملغي' || k.status === 'معلق') return;
    const auto = k.autoRenew === 'yes' && k.status !== 'لن يُجدد';
    let endStr = k.end;
    if (auto) { const m = Number(k.renewMonths) || 12; let g = 0; while (endStr < todayStr && g++ < 60) endStr = addDays_(addMonths_(addDays_(endStr, 1), m), -1); }
    const end = new Date(endStr + 'T00:00:00');
    const left = Math.round((end - today) / 864e5);
    if (left < 0) return;                                         // منتهي بالفعل
    const nd = noticeDays_(k);
    const decision = left - nd;                                   // أيام حتى آخر موعد للإخطار
    if (decision < -nd) return;
    const stage = STAGES.filter(s => decision <= s).pop();        // أصغر مرحلة وصل لها
    if (stage === undefined) return;
    const key = k.id + '_' + endStr + '_' + stage;
    if (props.getProperty(key)) return;                           // تم الإرسال لهذه المرحلة
    due.push({ k, c: clients[k.clientId] || {}, left, decision, endStr, nd, auto, key });
  });

  if (!due.length) return;
  due.sort((a, b) => a.decision - b.decision);
  const rows = due.map(d =>
    `<tr><td style="padding:6px 10px;border:1px solid #ddd"><b>${esc_(d.c.name)}</b><br><span style="color:#777">${esc_(d.c.ref)}</span></td>` +
    `<td style="padding:6px 10px;border:1px solid #ddd;direction:ltr">${esc_(d.k.no)}</td>` +
    `<td style="padding:6px 10px;border:1px solid #ddd">${esc_(d.k.title)}</td>` +
    `<td style="padding:6px 10px;border:1px solid #ddd">${fmt_(d.endStr)}${d.auto ? '<br><span style="color:#578d18">🔄 تجديد تلقائي' + (d.k.renewPricing ? ' — ' + esc_(d.k.renewPricing) + (d.k.renewIncrease ? ' ' + d.k.renewIncrease + '%' : '') : '') + '</span>' : ''}</td>` +
    `<td style="padding:6px 10px;border:1px solid #ddd">${d.nd ? fmt_(addDays_(d.endStr, -d.nd)) + '<br><span style="color:#777">' + esc_(d.k.noticeValue + ' ' + (d.k.noticeUnit || 'شهر')) + (d.k.noticeMethod ? ' — ' + esc_(d.k.noticeMethod) : '') + '</span>' : '—'}</td>` +
    `<td style="padding:6px 10px;border:1px solid #ddd;color:${d.decision <= 30 ? '#d64545' : '#c98a06'}"><b>${d.decision < 0 ? 'فات موعد الإخطار' : d.decision + ' يوم'}</b></td>` +
    `<td style="padding:6px 10px;border:1px solid #ddd">${d.k.value ? Number(d.k.value).toLocaleString('en-US') + ' ج.م' : '—'}</td></tr>`).join('');
  const html =
    `<div dir="rtl" style="font-family:Tahoma,Arial;font-size:14px;color:#1d2235">` +
    `<h2 style="color:#161A3C;border-bottom:3px solid #6BAB20;padding-bottom:6px">⏰ عقود تقترب من الانتهاء</h2>` +
    `<p>العقود التالية تحتاج قرار (تجديد / إخطار بعدم التجديد / تفاوض على قيمة جديدة) خلال ${STAGES[0]} يوم أو أقل:</p>` +
    `<table style="border-collapse:collapse;font-size:13px"><tr style="background:#f4f6f9">` +
    `<th style="padding:6px 10px;border:1px solid #ddd">العميل</th><th style="padding:6px 10px;border:1px solid #ddd">رقم العقد</th>` +
    `<th style="padding:6px 10px;border:1px solid #ddd">الموضوع</th><th style="padding:6px 10px;border:1px solid #ddd">تاريخ الانتهاء</th>` +
    `<th style="padding:6px 10px;border:1px solid #ddd">آخر موعد للإخطار</th><th style="padding:6px 10px;border:1px solid #ddd">المتبقي على القرار</th><th style="padding:6px 10px;border:1px solid #ddd">القيمة</th></tr>${rows}</table>` +
    `<p><a href="${APP_URL}#/contracts" style="background:#6BAB20;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none">فتح العقود في البرنامج</a></p>` +
    `<p style="color:#888;font-size:12px">Delta Trading Co. — تنبيه تلقائي</p></div>`;
  MailApp.sendEmail({
    to: NOTIFY_TO,
    subject: `⏰ ${due.length} عقد يحتاج قرار تجديد/إخطار — أقربها ${due[0].c.name || ''} (باقي ${Math.max(0, due[0].decision)} يوم)`,
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
function noticeDays_(k) { const v = Number(k.noticeValue) || 0; return k.noticeUnit === 'يوم' ? v : Math.round(v * 30); }
function addDays_(s, n) { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function addMonths_(s, n) { const d = new Date(s + 'T00:00:00Z'), day = d.getUTCDate(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + n);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate(); d.setUTCDate(Math.min(day, last)); return d.toISOString().slice(0, 10); }
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
