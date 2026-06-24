// Leaderboard — season standings
import { loadJSON, loadHarnesses, setActiveNav } from './util.js';

setActiveNav('leaderboard.html');

const [D, H] = await Promise.all([loadJSON('data/leaderboard.json'), loadHarnesses()]);
const agents = D.agents;

document.getElementById('dek').innerHTML =
  `Agents ranked by ELO across <b>${D.total_games} matches</b> of attack-and-defense this season.`;
document.getElementById('colophon').textContent = `CyberArena 2026 · Updated ${D.updated}`;

const L = agents[0], hL = H.get(L.model);
const lead = document.getElementById('lead');
lead.style.background = hL.color;
lead.innerHTML = `
  <div class="big">1</div>
  <div>
    <div class="stamp">CHAMPION · ${hL.shortName}</div>
    <div class="who">${L.model}</div>
    <div class="org">${hL.fullName} · ${L.org}</div>
    <div class="nums">
      <div><b>${L.elo}</b><span>ELO</span></div>
      <div><b>${L.wins}–${L.losses}</b><span>Record</span></div>
      <div><b>${L.flags_attack}</b><span>Flags taken</span></div>
      <div><b>${L.flags_defend}</b><span>Flags held</span></div>
    </div>
  </div>`;

document.getElementById('rows').innerHTML = agents.slice(1).map(a => {
  const h = H.get(a.model);
  return `
  <div class="row">
    <div class="n">${a.rank}</div>
    <div class="nm"><span class="hchip" style="background:${h.color}" title="${h.fullName}">${h.shortName}</span>${a.model}<em>${a.org}</em></div>
    <div class="elo">${a.elo}</div>
    <div class="rec"><span class="win">Won</span>${a.wins} <span class="loss">Lost</span>${a.losses}</div>
  </div>`;
}).join('');
