export async function makeWorkbook(company, headcount, template, JSZip) {
  if (typeof company !== 'string' || !company.trim() || !Number.isInteger(headcount) || headcount < 1 || headcount > 300) throw new Error('请先完成公司人数登记。');
  const zip = await JSZip.loadAsync(template);
  const entry = zip.file('xl/worksheets/sheet1.xml');
  if (!entry) throw new Error('名单模板不可用。');
  let xml = await entry.async('string');
  const safe = company.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
  for (let i = 2; i < headcount + 2; i++) {
    const re = new RegExp(`(<x:c r="A${i}" s="[0-9]+")\\s*/>`);
    if (!re.test(xml)) throw new Error('名单模板不完整。');
    xml = xml.replace(re, (_, opening) => `${opening} t="inlineStr"><x:is><x:t xml:space="preserve">${safe}</x:t></x:is></x:c>`);
  }
  zip.file('xl/worksheets/sheet1.xml', xml);
  return zip.generateAsync({type:'uint8array',compression:'DEFLATE'});
}

if (typeof document !== 'undefined') {
  document.getElementById('download-company-list')?.addEventListener('click', async () => {
    const button = document.getElementById('download-company-list');
    const message = document.getElementById('download-message');
    button.disabled = true;
    message.textContent = '正在生成名单…';
    try {
      const company = document.getElementById('receipt-company').textContent.trim();
      const count = Number(document.getElementById('receipt-count').textContent);
      const response = await fetch('./assets/seria-attendee-template-v2.xlsx');
      if (!response.ok || !window.JSZip) throw new Error('模板下载失败，请刷新后重试。');
      const bytes = await makeWorkbook(company, count, await response.arrayBuffer(), window.JSZip);
      const url = URL.createObjectURL(new Blob([bytes], {type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
      const link = document.createElement('a'); link.href = url; link.download = 'Seria年会出席人员名单.xlsx'; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      message.textContent = '已生成本公司名单，请填写后交给筹备组。';
    } catch (error) { message.textContent = error.message || '生成失败，请刷新后重试。'; }
    finally { button.disabled = false; }
  });
}

