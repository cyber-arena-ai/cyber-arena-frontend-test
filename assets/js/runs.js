// Runs directory — all matches this season (competitor-agnostic)
import { loadJSON, loadHarnesses, fmtTime, setActiveNav } from './util.js';

setActiveNav('runs.html');

const [D, H] = await Promise.all([loadJSON('data/runs.json'), loadHarnesses()]);
const runs = [...D.runs].sort((a,b) => b.id.localeCompare(a.id)); // newest first

const decisive = runs.filter(r => r.winner !== 'draw').length;
const draws = runs.filter(r => r.winner === 'draw').length;
const models = [...new Set(runs.flatMap(r => [r.teams.team1.model, r.teams.team2.model]))];

// dek adapts: if the whole season is one matchup, name it; otherwise stay generic
document.getElementById('dek').innerHTML = models.length === 2
  ? `<b>${D.count} matches</b> this season · ${models[0]} vs ${models[1]}.`
  : `<b>${D.count} matches</b> this season · ${models.length} agents.`;
document.getElementById('mastmeta').textContent = `${D.count} matches`;
document.getElementById('colophon').textContent = `CyberArena 2026 · Updated ${D.updated}`;

document.getElementById('summary').innerHTML = `
  <div><b>${D.count}</b><span>Matches</span></div>
  <div class="acc-b"><b>${decisive}</b><span>Decisive</span></div>
  <div class="acc-p"><b>${draws}</b><span>Draws</span></div>
  <div><b>${models.length}</b><span>Agents</span></div>`;

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const dateLabel = (d, t) => {
  const [, m, day] = d.split('-');
  return `<b>${MONTHS[+m-1]} ${+day}</b>${t}`;
};

function scoreHTML(r, h1, h2){
  const s1 = r.winner === 'team1' ? `style="color:${h1.color}"` : 'class="lo"';
  const s2 = r.winner === 'team2' ? `style="color:${h2.color}"` : 'class="lo"';
  return `<span ${s1}>${r.score.team1}</span><span class="dash">–</span><span ${s2}>${r.score.team2}</span>`;
}
function winTag(r, hw){
  if(r.winner === 'draw') return `<span class="tag draw">Draw</span>`;
  return `<span class="tag" style="background:${hw.color};color:var(--paper);border-color:var(--ink)" title="${hw.fullName}">${hw.shortName} · ${r.teams[r.winner].org}</span>`;
}

function renderList(list){
  document.getElementById('runs').innerHTML = list.map(r => {
    const live = r.has_thread;
    const h1 = H.get(r.teams.team1.model), h2 = H.get(r.teams.team2.model);
    const hw = r.winner !== 'draw' ? H.get(r.teams[r.winner].model) : null;
    const inner = `
      <div class="rdate">${dateLabel(r.date, r.time)}</div>
      <div>
        <div class="rname">${r.name} <span class="badge ${r.category.toLowerCase()}">${r.category}</span></div>
        <div class="rmeta">${r.challenge} · ${r.rounds} rounds · ${fmtTime(r.duration_s)}</div>
        <div class="rvs"><span class="c1" style="color:${h1.color}">●</span>${r.teams.team1.model} <span class="vs">vs</span> <span class="c2" style="color:${h2.color}">●</span>${r.teams.team2.model}</div>
      </div>
      <div class="rscore">${scoreHTML(r, h1, h2)}</div>
      <div class="rwin">${winTag(r, hw)}<span class="rounds">${live ? 'view thread' : 'thread soon'}</span></div>
      <div class="rgo">→</div>`;
    return live
      ? `<a class="run live" href="trajectory.html?run=${r.name}">${inner}</a>`
      : `<div class="run dead">${inner}</div>`;
  }).join('');
}
renderList(runs);

// category filters
const cats = ['all', ...new Set(runs.map(r => r.category))];
document.getElementById('filt').innerHTML = cats.map((c,i) =>
  `<button data-c="${c}" class="${i===0?'on':''}">${c === 'all' ? 'all' : c}</button>`).join('');

document.querySelectorAll('#filt button').forEach(b => b.onclick = () => {
  document.querySelectorAll('#filt button').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  const c = b.dataset.c;
  renderList(c === 'all' ? runs : runs.filter(r => r.category === c));
});
