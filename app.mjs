import {countdown,eventState,readReceiptState} from './core.mjs';
const byId = id => document.getElementById(id);
const ja = document.documentElement.lang === 'ja';
const copy = ja ? {
  today:'お会いするのは、今日',past:'ご参加ありがとうございました',upcoming:'お会いする日まで、あと',closed:'出席の受付は終了しました',view:'招待状を見る',
  calendarTitle:'2027年 上海Seria年会',calendarLocation:'溪云杏谷民宿（中国・浙江省杭州市桐廬県分水鎮朝陽村、珠洞坞銀杏景区の北西約150m）',calendarDescription:'開催時間と交通手段は、年会実行委員会より別途ご案内します。',calendarToast:'カレンダーファイルを作成しました。WeChatで開けない場合はシステムブラウザをご利用ください。',
  confirmed:'出席回答済み',required:'お名前をご記入のうえ、所属会社と性別をお選びください。',sending:'送信しています…',submit:'出席を確定する',
  invalid:'ご入力内容をご確認のうえ、もう一度お試しください。',conflict:'この端末からは回答済みです。変更は実行委員会へご連絡ください。',ended:'今回の出席受付は終了しました。',
  busy:'保存できませんでした。しばらくしてからお試しください。再送信しても重複登録されません。',slow:'応答に時間がかかっています。再送信しても重複登録されません。',offline:'ネットワークをご確認のうえ、もう一度お試しください。'
} : {
  today:'相聚，就在今天',past:'感谢相聚，期待再会',upcoming:'距离相聚，还有',closed:'本次出席确认已结束',view:'查看邀请',
  calendarTitle:'2027 上海 Seria 年会',calendarLocation:'溪云杏谷民宿，浙江省杭州市桐庐县分水镇朝阳村（珠洞坞银杏景区西北约150米）',calendarDescription:'年会活动时段及交通安排待筹备组通知。',calendarToast:'已生成日历文件；如微信未打开，可用系统浏览器下载',
  confirmed:'已确认出席',required:'请填写姓名并选择所属公司和性别，再确认出席。',sending:'正在提交…',submit:'确认出席，桐庐见',
  invalid:'请检查姓名、所属公司、性别和备注后重试。',conflict:'此设备已提交过回执，如需修改请联系年会筹备组。',ended:'本次年会的出席确认已结束。',
  busy:'暂时未能保存，请稍后重试；重复提交不会生成多份回执。',slow:'网络响应较慢，请重试；重复提交不会生成多份回执。',offline:'网络暂时未连接，请检查网络后重试。'
};
const API_URL = 'https://cloud1-d2gcviutuf82a0f17-1429108820.ap-shanghai.app.tcloudbase.com/seria-annual-2027-rsvp';
const STORAGE_KEY = 'seria-annual-2027-receipt';
let inMemoryState = null;
function readState() {try{return readReceiptState(localStorage,STORAGE_KEY,inMemoryState);}catch{return inMemoryState;}}
function saveState(value) { inMemoryState=value;try { localStorage.setItem(STORAGE_KEY,JSON.stringify(value)); } catch { /* Private browsing: retain the receipt in memory for retries. */ } }
function refreshCountdown() {
  for(const [key,value] of Object.entries(countdown())) byId(key).textContent=String(value).padStart(2,'0');
  const state=eventState();byId('countdown-title').textContent=copy[state];
  if(state==='past'&&!readState()?.receiptCode) {
    byId('submit-button').disabled=true;byId('submit-button').firstElementChild.textContent=copy.closed;
    byId('mobile-rsvp').textContent=copy.view;byId('mobile-rsvp').href='#invitation';
  }
}
refreshCountdown();setInterval(refreshCountdown,1000);
let toastTimer;
function toast(message) {byId('toast').textContent=message;byId('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>byId('toast').classList.remove('visible'),3500);}
function share() {byId('share-dialog').showModal();}
byId('share-button').addEventListener('click',share);byId('mobile-share').addEventListener('click',share);
byId('share-dialog').addEventListener('click',event=>{if(event.target===event.currentTarget)event.currentTarget.close();});
byId('calendar-button').addEventListener('click',()=>{
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Seria Shanghai//Annual Gala 2027//ZH','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:seria-annual-2027-20261225@seria','DTSTAMP:20261029T000000Z','DTSTART;VALUE=DATE:20261225','DTEND;VALUE=DATE:20261226','SUMMARY:'+copy.calendarTitle,'LOCATION:'+copy.calendarLocation,'DESCRIPTION:'+copy.calendarDescription,'END:VEVENT','END:VCALENDAR',''].join('\r\n');
  const url=URL.createObjectURL(new Blob([ics],{type:'text/calendar;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='Seria-20261225.ics';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast(copy.calendarToast);
});
function showSuccess(code) {
  byId('rsvp-form').hidden=true;byId('rsvp-success').hidden=false;byId('receipt-code').textContent=code;
  byId('mobile-rsvp').textContent=copy.confirmed+' ✓';
}
const saved=readState();if(saved?.receiptCode&&/^[0-9A-F]{12}$/.test(saved.receiptCode))showSuccess(saved.receiptCode);
byId('rsvp-form').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;const message=byId('form-message');
  const name=byId('guest-name').value.trim(),company=byId('guest-company').value,gender=byId('guest-gender').value;
  if(!name||!company||!gender){message.textContent=copy.required;(!name?byId('guest-name'):!company?byId('guest-company'):byId('guest-gender')).focus();return;}
  if(!form.reportValidity())return;
  const state=readState()||{receipt:crypto.randomUUID()};saveState(state);
  const button=byId('submit-button');button.disabled=true;button.firstElementChild.textContent=copy.sending;message.textContent='';
  try {
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);let response;
    try {response=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify({name,company,gender,note:byId('guest-note').value.trim(),website:byId('guest-website').value,receipt:state.receipt}),signal:controller.signal});} finally {clearTimeout(timer);}
    let result;
    try {result=await response.json();} catch {throw new Error(copy.busy);}
    if(!response.ok||result.ok!==true)throw new Error(response.status===409?copy.conflict:response.status===410?copy.ended:response.status===400?copy.invalid:copy.busy);
    if(!/^[0-9A-F]{12}$/.test(result.receiptCode))throw new Error(copy.busy);
    saveState({...state,receiptCode:result.receiptCode});showSuccess(result.receiptCode);
  } catch(error) {message.textContent=error.name==='AbortError'?copy.slow:error instanceof TypeError?copy.offline:error.message;}
  finally {button.disabled=false;button.firstElementChild.textContent=copy.submit;}
});

