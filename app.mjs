import {countdown,eventState,readReceiptState} from './core.mjs';

const byId = id => document.getElementById(id);
const ja = document.documentElement.lang === 'ja';

const copy = {
  today: ja ? 'お会いするのは、今日' : '相聚，就在今天',
  past: ja ? 'ご参加ありがとうございました' : '感谢相聚，期待再会',
  upcoming: ja ? 'お会いできる日まで、あと' : '距离相聚，还有',
  closed: '本次出席登记已结束',
  view: '查看邀请',
  calendarTitle: ja ? '2027年 上海Seria年次懇親会' : '2027 上海 Seria 年会',
  calendarLocation: ja
    ? '溪云杏谷民宿（中国・浙江省杭州市桐廬県分水鎮朝陽村、珠洞坞銀杏景区の北西約150m）'
    : '溪云杏谷民宿，浙江省杭州市桐庐县分水镇朝阳村（珠洞坞银杏景区西北约150米）',
  calendarDescription: ja
    ? '開催時間と交通手段は、年次懇親会実行委員会より別途ご案内します。'
    : '年会活动时段及交通安排待筹备组通知。',
  calendarToast: ja
    ? 'カレンダーファイルを作成しました。WeChatで開けない場合はシステムブラウザをご利用ください。'
    : '已生成日历文件；如微信未打开，可用系统浏览器下载',
  required: '请填写公司名称，并输入有效的参会人数。',
  sending: '正在提交…',
  submit: '确认提交',
  invalid: '请检查公司名称和参会人数后重试。',
  ended: '本次年会登记已结束。',
  busy: '暂时未能保存，请稍后重试；重复提交不会重复创建名单行。',
  slow: '网络响应较慢，请重试；重复提交不会重复创建名单行。',
  offline: '网络暂时未连接，请检查网络后重试。',
  backend: '后台接口尚未完成新版登记功能，请联系筹备组更新 CloudBase 云函数后再试。'
};

// Keep this endpoint stable. The CloudBase function behind it must be upgraded
// to accept mode=company_headcount and create one attendee row per requested seat.
const API_URL = 'https://cloud1-d2gcviutuf82a0f17-1429108820.ap-shanghai.app.tcloudbase.com/seria-annual-2027-rsvp';
const STORAGE_KEY = 'seria-annual-2027-company-registration-v2-reset-20261105';
let inMemoryState = null;

function readState() {
  try { return readReceiptState(localStorage, STORAGE_KEY, inMemoryState); }
  catch { return inMemoryState; }
}
function saveState(value) {
  inMemoryState = value;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); }
  catch { /* Keep the request id in memory if browser storage is unavailable. */ }
}

function refreshCountdown() {
  for (const [key, value] of Object.entries(countdown())) {
    const node = byId(key);
    if (node) node.textContent = String(value).padStart(2, '0');
  }
  const state = eventState();
  const title = byId('countdown-title');
  if (title) title.textContent = copy[state];

  if (state === 'past' && !readState()?.receiptCode) {
    const submitButton = byId('submit-button');
    if (submitButton) {
      submitButton.disabled = true;
      const label = submitButton.querySelector('span');
      if (label) label.textContent = copy.closed;
    }
    const mobileRsvp = byId('mobile-rsvp');
    if (mobileRsvp) {
      mobileRsvp.textContent = copy.view;
      mobileRsvp.href = '#invitation';
    }
  }
}
refreshCountdown();
setInterval(refreshCountdown, 1000);

let toastTimer;
function toast(message) {
  const node = byId('toast');
  if (!node) return;
  node.textContent = message;
  node.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('visible'), 3500);
}

function share() {
  const dialog = byId('share-dialog');
  if (dialog?.showModal) dialog.showModal();
}
byId('share-button')?.addEventListener('click', share);
byId('mobile-share')?.addEventListener('click', share);
byId('copy-share-link')?.addEventListener('click', async () => {
  const link = new URL('./', location.href).href;
  const status = byId('share-link-status');
  try {
    await navigator.clipboard.writeText(link);
    if (status) status.textContent = '链接已复制，可以粘贴发送。';
  } catch {
    const field = byId('share-link-value');
    if (field) { field.value = link; field.hidden = false; field.focus(); field.select(); }
    if (status) status.textContent = '请长按或选中上方链接后复制。';
  }
});
byId('share-dialog')?.addEventListener('click', event => {
  if (event.target === event.currentTarget) event.currentTarget.close();
});

byId('calendar-button')?.addEventListener('click', () => {
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//Seria Shanghai//Annual Gala 2027//ZH',
    'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    'UID:seria-annual-2027-20261225@seria',
    'DTSTAMP:20261029T000000Z',
    'DTSTART;VALUE=DATE:20261225',
    'DTEND;VALUE=DATE:20261226',
    'SUMMARY:' + copy.calendarTitle,
    'LOCATION:' + copy.calendarLocation,
    'DESCRIPTION:' + copy.calendarDescription,
    'END:VEVENT', 'END:VCALENDAR', ''
  ].join('\\r\\n');
  const url = URL.createObjectURL(new Blob([ics], {type: 'text/calendar;charset=utf-8'}));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Seria-20261225.ics';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast(copy.calendarToast);
});

function showSuccess(data) {
  const form = byId('rsvp-form');
  const success = byId('rsvp-success');
  if (form) form.hidden = true;
  if (success) success.hidden = false;
  if (byId('receipt-company')) byId('receipt-company').textContent = data.company || '';
  if (byId('receipt-count')) byId('receipt-count').textContent = String(data.headcount || '');
  if (byId('receipt-code')) byId('receipt-code').textContent = data.receiptCode || '';
  const mobileRsvp = byId('mobile-rsvp');
  if (mobileRsvp) mobileRsvp.textContent = '登记成功 ✓';
}

const saved = readState();
if (saved?.receiptCode && /^[0-9A-F]{12}$/.test(saved.receiptCode) &&
    typeof saved.company === 'string' && Number.isInteger(saved.headcount)) {
  showSuccess(saved);
}

// The Japanese page intentionally has no RSVP form; only the Chinese page
// initializes the company/headcount registration handler.
const form = byId('rsvp-form');
if (form) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const message = byId('form-message');
    const company = byId('guest-company')?.value.trim() || '';
    const headcount = Number(byId('guest-count')?.value);

    if (!company || !Number.isInteger(headcount) || headcount < 1 || headcount > 300) {
      if (message) message.textContent = copy.required;
      if (!company) byId('guest-company')?.focus();
      else byId('guest-count')?.focus();
      return;
    }
    if (!form.reportValidity()) return;

    const state = readState() || {receipt: crypto.randomUUID()};
    saveState(state);
    const button = byId('submit-button');
    const buttonLabel = button?.querySelector('span');
    if (button) button.disabled = true;
    if (buttonLabel) buttonLabel.textContent = copy.sending;
    if (message) message.textContent = '';

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      let response;
      try {
        response = await fetch(API_URL, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          credentials: 'omit',
          body: JSON.stringify({
            mode: 'company_headcount',
            company,
            headcount,
            requestId: state.receipt,
            website: byId('guest-website')?.value || ''
          }),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timer);
      }

      let result;
      try { result = await response.json(); }
      catch { throw new Error(copy.backend); }

      if (response.status === 409) throw new Error('该登记请求已处理，请勿重复提交。');
      if (response.status === 410) throw new Error(copy.ended);
      if (response.status === 400) throw new Error(copy.invalid);
      if (!response.ok || result.ok !== true) {
        throw new Error(result.message || copy.backend);
      }

      // Require the backend to confirm the exact number of blank attendee rows.
      // Never show success merely because an old person-level endpoint returned 200.
      if (result.rowsCreated !== headcount || !/^[0-9A-F]{12}$/.test(result.receiptCode || '')) {
        throw new Error(copy.backend);
      }

      const completed = {
        ...state,
        company,
        headcount,
        rowsCreated: result.rowsCreated,
        receiptCode: result.receiptCode
      };
      saveState(completed);
      showSuccess(completed);
    } catch (error) {
      if (message) {
        message.textContent = error.name === 'AbortError'
          ? copy.slow
          : error instanceof TypeError
            ? copy.offline
            : error.message || copy.busy;
      }
    } finally {
      if (button) button.disabled = false;
      if (buttonLabel) buttonLabel.textContent = copy.submit;
    }
  });
}
