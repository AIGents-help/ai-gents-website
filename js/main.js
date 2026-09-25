(() => {
  const toggle = document.querySelector('.menu-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      links.classList.toggle('open', open);
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { links.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open menu'); }));
  }
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => { if (a.getAttribute('href') === current) a.setAttribute('aria-current', 'page'); });
  const flowExamples = {
    forms: {beforeTitle:'The form has three versions.',beforeCopy:'Staff collect the same information in different places and follow up by email.',afterTitle:'One intake. Clear ownership.',afterCopy:'A shared form routes each submission to the right person and keeps a usable record.'},
    handoff: {beforeTitle:'The request disappears between teams.',beforeCopy:'Everyone knows their part, but nobody can see who has the next step.',afterTitle:'A visible path from start to finish.',afterCopy:'Name each owner, decision, and exception so work moves without guesswork.'},
    updates: {beforeTitle:'A simple update takes a developer.',beforeCopy:'Events, notices, and page changes wait in a queue while information goes stale.',afterTitle:'The team can publish with confidence.',afterCopy:'A clear editing workflow lets authorized staff update content and review it before it goes live.'}
  };
  const flowButtons = document.querySelectorAll('[data-flow]');
  if (flowButtons.length) {
    const fields = {'demo-before-title':'beforeTitle','demo-before-copy':'beforeCopy','demo-after-title':'afterTitle','demo-after-copy':'afterCopy'};
    flowButtons.forEach(button => button.addEventListener('click', () => {
      const example = flowExamples[button.dataset.flow];
      if (!example) return;
      flowButtons.forEach(item => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
      Object.entries(fields).forEach(([id,key]) => { document.getElementById(id).textContent = example[key]; });
    }));
  }
  const form = document.querySelector('#inquiry-form');
  if (!form) return;
  const choice = new URLSearchParams(location.search).get('service');
  const choices = {workflow:'Field to Flow assessment', documents:'Workflow and documents', advisory:'Field to Flow assessment', language:'Corporate language development', website:'Website or portal'};
  if (choices[choice]) form.elements.service.value = choices[choice];
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type=submit]');
    const status = document.querySelector('#form-status');
    const fields = new FormData(form);
    button.disabled = true; button.textContent = 'Sending…'; status.textContent = '';
    try {
      const response = await fetch('https://apcvfezfmegqqjuonrgl.supabase.co/functions/v1/submit-inquiry', {
        method: 'POST', headers: {'Content-Type':'application/json', 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwY3ZmZXpmbWVncXFqdW9ucmdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDI5MDksImV4cCI6MjA5NTkxODkwOX0.3p2hvVCTERknQwgh6F3s98St0uNPDVtojH8XVBz2POc'},
        body: JSON.stringify({first_name: String(fields.get('name')).trim(), last_name:'', email:String(fields.get('email')).trim(), company:String(fields.get('company')).trim(), role:null, industry:null, message:'[Area] '+fields.get('service')+'\n\n[Project]\n'+String(fields.get('message')).trim(), source:'AI Gents website'})
      });
      if (!response.ok) throw new Error('Submission failed');
      form.reset(); status.textContent = 'Thank you. Your message was sent.';
    } catch (error) { status.textContent = 'We could not send your note. Please email contact@aigents.help.'; }
    finally { button.disabled = false; button.textContent = 'Speak with an AI Gent'; }
  });
})();
