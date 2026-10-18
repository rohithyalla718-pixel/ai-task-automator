const STORAGE_KEY = 'taskpilot-workflows-v1';
const taskInput = document.querySelector('#taskInput');
const list = document.querySelector('#workflowList');
const detail = document.querySelector('#detailCard');
const empty = document.querySelector('#emptyWorkflows');
const error = document.querySelector('#inputError');
let workflows = loadWorkflows();
let selectedId = workflows[0]?.id || null;

function loadWorkflows() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows)); }
function idFor(text) { let hash = 0; for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0; return `wf-${Math.abs(hash)}-${text.length}`; }
function titleCase(text) { return text.trim().replace(/\s+/g, ' ').replace(/^./, c => c.toUpperCase()); }
function makeSteps(task) {
  const t = task.toLowerCase();
  if (/(launch|campaign|product)/.test(t)) return ['Define the launch goal and audience','Create the campaign brief','Prepare launch assets and messaging','Set up the distribution channels','Review, schedule, and share the launch'];
  if (/(website|portfolio|site)/.test(t)) return ['Outline the pages and content','Choose a visual direction','Build the core pages','Add polish, links, and responsive states','Publish and share your new site'];
  if (/(offsite|event|trip|party)/.test(t)) return ['Set the date, budget, and goals','Shortlist venues or activities','Confirm the itinerary with the team','Book everything and share logistics','Send a final reminder'];
  if (/(learn|course|study|read)/.test(t)) return ['Choose a clear learning outcome','Gather the best resources','Block time for focused practice','Apply the idea to a small project','Review what you learned'];
  return ['Clarify the outcome and definition of done','Break the work into the smallest next steps','Gather what you need to begin','Do the focused work','Review, wrap up, and share the result'];
}
function createWorkflow(raw) { const task = titleCase(raw); const existing = workflows.find(w => w.title.toLowerCase() === task.toLowerCase()); if (existing) return existing; const now = new Date(); const workflow = { id:idFor(task), title:task, created:now.toISOString(), steps:makeSteps(task).map((label, i) => ({label, done:false})) }; workflows = [workflow, ...workflows]; selectedId = workflow.id; save(); return workflow; }
function activeWorkflow() { return workflows.find(w => w.id === selectedId) || workflows[0]; }
function formatDate(iso) { const d = new Date(iso); return d.toLocaleDateString(undefined,{month:'short',day:'numeric'}); }
function renderList() { list.innerHTML = workflows.map(w => { const done=w.steps.filter(s=>s.done).length, pct=Math.round(done/w.steps.length*100); return `<div class="workflow-item ${w.id===selectedId?'selected':''}" data-id="${w.id}"><div class="workflow-top"><h3>${escapeHtml(w.title)}</h3><small>${formatDate(w.created)}</small></div><div class="progress-line"><i style="width:${pct}%"></i></div><div class="workflow-meta"><span>${done} of ${w.steps.length} steps</span><strong>${pct}%</strong></div></div>`; }).join(''); empty.style.display = workflows.length ? 'none' : 'block'; document.querySelector('#workflowCount').textContent = workflows.length; }
function renderDetail() { const w=activeWorkflow(); if(!w){ detail.innerHTML='<div class="detail-empty"><p class="detail-kicker">READY WHEN YOU ARE</p><h3>Choose your next outcome.</h3><p class="detail-sub">Your active workflow will appear here.</p></div>'; return; } const done=w.steps.filter(s=>s.done).length, pct=Math.round(done/w.steps.length*100); detail.innerHTML=`<p class="detail-kicker">${pct===100?'COMPLETE':'WORKFLOW'}</p><h3>${escapeHtml(w.title)}</h3><p class="detail-sub">${pct===100?'You made it happen. Nice work.':'A clear path from intention to done.'}</p><div class="big-progress"><div class="bar"><i style="width:${pct}%"></i></div><strong>${pct}%</strong></div><div class="checklist">${w.steps.map((s,i)=>`<label class="check-item ${s.done?'done':''}"><input type="checkbox" data-step="${i}" ${s.done?'checked':''}/><span>${escapeHtml(s.label)}</span></label>`).join('')}</div><div class="detail-actions"><button class="secondary-button" id="resetBtn">↺ Reset progress</button><button class="secondary-button" id="deleteBtn">⌫ Delete workflow</button></div>`; }
function render() { renderList(); renderDetail(); }
function escapeHtml(s) { return s.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function toast(message) { const el=document.querySelector('#toast'); el.textContent=message; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2200); }
document.querySelector('#generateBtn').addEventListener('click',()=>{ error.textContent=''; if(!taskInput.value.trim()){ error.textContent='Give your outcome a name to get started.'; taskInput.focus(); return; } createWorkflow(taskInput.value); taskInput.value=''; render(); toast('Workflow generated'); document.querySelector('#workflows').scrollIntoView({behavior:'smooth',block:'start'}); });
document.querySelectorAll('.suggestion').forEach(button=>button.addEventListener('click',()=>{ taskInput.value=button.dataset.task; taskInput.focus(); error.textContent=''; }));
taskInput.addEventListener('keydown',event=>{ if((event.ctrlKey||event.metaKey)&&event.key==='Enter') document.querySelector('#generateBtn').click(); });
list.addEventListener('click',e=>{const item=e.target.closest('.workflow-item'); if(item){ selectedId=item.dataset.id; render(); }});
detail.addEventListener('change',e=>{if(e.target.matches('[data-step]')){const w=activeWorkflow(); w.steps[Number(e.target.dataset.step)].done=e.target.checked; save(); render(); toast(e.target.checked?'Step complete':'Step reopened'); }});
detail.addEventListener('click',e=>{if(e.target.id==='resetBtn'){const w=activeWorkflow(); w.steps.forEach(s=>s.done=false); save(); render(); toast('Progress reset');} if(e.target.id==='deleteBtn'){const w=activeWorkflow(); workflows=workflows.filter(item=>item.id!==w.id); selectedId=workflows[0]?.id||null; save(); render(); toast('Workflow deleted');}});
document.querySelector('#clearAllBtn').addEventListener('click',()=>{if(!workflows.length)return; workflows=[]; selectedId=null; save(); render(); toast('All workflows cleared');});
document.querySelector('#focusToggle').addEventListener('click',e=>{const on=document.body.classList.toggle('focus-mode'); e.currentTarget.setAttribute('aria-pressed',on); e.currentTarget.innerHTML=on?'Enabled <span>✓</span>':'Enable <span>→</span>'; toast(on?'Focus mode enabled':'Focus mode disabled');});
document.querySelector('#currentDate').textContent = new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}); document.querySelector('.welcome .eyebrow').childNodes[0].textContent = new Date().toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'}).toUpperCase()+'  '; render();
