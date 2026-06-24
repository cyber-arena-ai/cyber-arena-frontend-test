// Trajectory (single match) — chat thread + Sublime-style minimap
import { loadJSON, loadHarnesses, fmtTime, esc, setActiveNav } from './util.js';

setActiveNav('trajectory.html');

const params = new URLSearchParams(location.search);
const runId = params.get('run') || 'nautilus-ico';

const [D, H] = await Promise.all([loadJSON(`data/trajectory-${runId}.json`), loadHarnesses()]);
const t1 = D.teams.team1, t2 = D.teams.team2;

// resolve each team to its harness and theme the page with its color
const HH = { team1: H.get(t1.model), team2: H.get(t2.model) };
const wrap = document.querySelector('.wrap');
wrap.style.setProperty('--t1', HH.team1.color);
wrap.style.setProperty('--t2', HH.team2.color);

/* ---- headline + scoreboard ---- */
const wlabel = D.winner === 'team1' ? t1.label : t2.label;
const llabel = D.winner === 'team1' ? t2.label : t1.label;
const wpts = Math.max(D.score.team1, D.score.team2);
const lpts = Math.min(D.score.team1, D.score.team2);

document.getElementById('mastcat').textContent = D.category;
document.getElementById('mastname').textContent = D.name;
document.getElementById('dateline').textContent = D.date;

const markColor = D.winner === 'draw' ? HH.team1.color : HH[D.winner].color;
document.getElementById('hl').innerHTML = D.winner === 'draw'
  ? `<mark style="background:${HH.team1.color}">${t1.label}</mark> and <em>${t2.label}</em> draw ${D.score.team1}–${D.score.team2}`
  : `<mark style="background:${markColor}">${wlabel}</mark> def. <em>${llabel}</em> · ${wpts}–${lpts}`;
document.getElementById('byline').textContent =
  `${D.rounds}-round attack-and-defense · ${D.category}. ${D.challenge}`;
document.getElementById('colophon').textContent = `CyberArena 2026 · ${D.date}`;

function side(team, key, cls){
  const w = D.winner === key;
  return `<div class="side ${cls} ${w?'win':''}">
    ${w?'<div class="stampwin">Winner</div>':''}
    <div class="nm">${team.label}</div><div class="md">${team.model}</div>
    <div class="pts">${D.score[key]}</div>
    <div class="br">⚑ ${D.attack_flags[key]} captured · ${D.defense_patches[key]} patched</div></div>`;
}
document.getElementById('board').innerHTML =
  side(t1,'team1','t1') + `<div class="mid">vs</div>` + side(t2,'team2','t2');

/* ---- chat thread ---- */
function actChip(a){
  const lbl = a.k==='bash' ? '$ shell' : a.k==='mcp' ? '⚙ cyberarena tool' : '⌕ web search';
  const txt = a.k==='mcp' ? a.x + '()' : a.x;
  return `<div class="act ${a.k}"><span class="al">${lbl}</span><code>${esc(txt)}</code></div>`;
}
function bubble(turn){
  const team = D.teams[turn.team], pos = turn.team==='team1' ? 'left' : 'right';
  const think = turn.think ? `<div class="think">${esc(turn.think)}</div>` : '';
  const acts = turn.acts.length ? `<div class="acts">${turn.acts.map(actChip).join('')}</div>` : '';
  return `<div class="msg ${pos} ${turn.team}" data-kind="turn" data-has-think="${turn.think?1:0}"
            data-mm-type="turn" data-mm-team="${turn.team}">
    <div class="ava">${HH[turn.team].shortName}</div>
    <div class="bub"><div class="bh"><span class="who">${team.label}</span><span class="tm">${fmtTime(turn.t)}</span></div>${think}${acts}</div>
  </div>`;
}
function sysMsg(e){
  const who = e.by==='team1' ? t1.label : t2.label;
  const victim = e.victim==='team1' ? t1.label : t2.label;
  if(e.k==='steal'){
    if(e.reason==='DUPLICATE')
      return `<div class="sys dup" data-kind="event" data-mm-type="dup" data-mm-team="${e.by}">${who} re-submitted a stolen flag — duplicate, no points · ${fmtTime(e.t)}</div>`;
    return `<div class="sys steal ${e.by}" data-kind="event" data-mm-type="capture" data-mm-team="${e.by}"
              title="${fmtTime(e.t)} — ${who} captured ${victim}'s flag">
              <b>⚑ ${who}</b> captured <b>${victim}'s</b> flag<span class="tm">${fmtTime(e.t)} · +100</span></div>`;
  }
  return `<div class="patchwrap" data-kind="event" data-mm-type="patch" data-mm-team="${e.by}" title="${fmtTime(e.t)} — ${who} patched">
            <span class="sys patch">⟳ ${who} patched the service · ${fmtTime(e.t)} · +20</span></div>`;
}

const rstarts = Object.entries(D.round_starts)
  .map(([r,t]) => ({ r:+r, t })).sort((a,b)=>a.t-b.t);

let html = '', ri = 0;
D.feed.forEach(item => {
  while(ri < rstarts.length && item.t >= rstarts[ri].t){
    html += `<div class="day" data-mm-type="round" data-mm-label="R${rstarts[ri].r}"><span>◆ Round ${rstarts[ri].r} · ${fmtTime(rstarts[ri].t)}</span></div>`;
    ri++;
  }
  html += item.kind==='event' ? sysMsg(item) : bubble(item);
});
const chat = document.getElementById('chat');
chat.innerHTML = html;

/* ---- per-team minimaps ---- */
document.getElementById('mmh1').textContent = HH.team1.shortName;
document.getElementById('mmh1').title = t1.label;
document.getElementById('mmh2').textContent = HH.team2.shortName;
document.getElementById('mmh2').title = t2.label;

document.getElementById('mmlegend').innerHTML = `
  <span><i class="s" style="background:${HH.team1.color};border-color:var(--ink)"></i>${t1.label} capture</span>
  <span><i class="s" style="background:${HH.team2.color};border-color:var(--ink)"></i>${t2.label} capture</span>
  <span><i class="s g"></i>service patch</span>
  <span><i class="s d"></i>duplicate</span>
  <span><i class="s" style="border:0;border-top:2px solid #c3b9a3;width:14px;height:0"></i>round start</span>`;

const minimaps = [...document.querySelectorAll('.minimap')];

function buildMinimaps(){
  const H = chat.scrollHeight || 1;
  minimaps.forEach(mini => {
    const team = mini.dataset.team;
    const marks = mini.querySelector('.marks');
    marks.innerHTML = '';
    [...chat.children].forEach(el => {
      if(el.style.display === 'none') return;
      const type = el.dataset.mmType;
      if(!type) return;
      // round markers appear in both columns; everything else only in its team's column
      if(type !== 'round' && el.dataset.mmTeam !== team) return;
      const top = (el.offsetTop + el.offsetHeight/2) / H * 100;
      const m = document.createElement('div');
      m.className = 'mk ' + type;
      m.style.top = top + '%';
      if(el.title) m.title = el.title;
      marks.appendChild(m);
    });
  });
  updateView();
}
function updateView(){
  const H = chat.scrollHeight || 1, vis = chat.clientHeight;
  document.querySelectorAll('.mm-view').forEach(v => {
    v.style.height = (vis / H * 100) + '%';
    v.style.top = (chat.scrollTop / H * 100) + '%';
  });
}
function scrubTo(body, clientY){
  const rect = body.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
  chat.scrollTop = ratio * chat.scrollHeight - chat.clientHeight / 2;
}
let dragBody = null;
minimaps.forEach(mini => {
  const body = mini.querySelector('.mm-body');
  body.addEventListener('mousedown', e => { dragBody = body; scrubTo(body, e.clientY); e.preventDefault(); });
});
window.addEventListener('mousemove', e => { if(dragBody) scrubTo(dragBody, e.clientY); });
window.addEventListener('mouseup', () => { dragBody = null; });
chat.addEventListener('scroll', updateView);
window.addEventListener('resize', buildMinimaps);

buildMinimaps();
// re-measure once web fonts settle (layout heights shift as they load)
if(document.fonts && document.fonts.ready) document.fonts.ready.then(buildMinimaps);
window.addEventListener('load', buildMinimaps);

/* ---- filters ---- */
document.querySelectorAll('.filt button').forEach(b => b.onclick = () => {
  document.querySelectorAll('.filt button').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  const f = b.dataset.f;
  chat.querySelectorAll('[data-kind="turn"]').forEach(el => {
    let show = true;
    if(f === 'event') show = false;
    else if(f === 'think') show = el.dataset.hasThink === '1';
    el.style.display = show ? '' : 'none';
    el.querySelectorAll('.acts').forEach(a => a.style.display = (f === 'think') ? 'none' : '');
  });
  chat.querySelectorAll('[data-kind="event"]').forEach(el => {
    el.style.display = (f === 'think') ? 'none' : '';
  });
  buildMinimaps();
});
