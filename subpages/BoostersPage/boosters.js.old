const container = document.getElementById("boost-embed");

// Use unique names from boosters-data.js
const date = new Date(typeof boosters_updatetime !== 'undefined' ? boosters_updatetime : (typeof updatetime !== 'undefined' ? updatetime : null));
const formatter = new Intl.DateTimeFormat('pl-PL', {
  timeZone: 'Europe/Warsaw',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});
const parts = formatter.formatToParts(date);
let day, month, year, hour, minute;
for (const part of parts) {
  if (part.type === 'day') day = part.value;
  else if (part.type === 'month') month = part.value;
  else if (part.type === 'year') year = part.value;
  else if (part.type === 'hour') hour = part.value;
  else if (part.type === 'minute') minute = part.value;
}
const formattedDate = `${day}.${month}.${year} ${hour}:${minute}`;

// Calculate total with ALL boosters (including id "0")
const _boosters = typeof boosters_data !== 'undefined' ? boosters_data : (typeof boosters !== 'undefined' ? boosters : []);
const totalBoosts = _boosters.reduce((sum, b) => sum + (Number(b.boosts) || 0), 0);
const boosters_value = (totalBoosts * 4.99).toFixed(2);
const now = new Date().toISOString().split("T")[0];

// Filter out id "0" BEFORE sorting and rendering
const visibleBoosters = _boosters.filter(b => b.id !== "0");

// Sort visible boosters descending by boosts
visibleBoosters.sort((a, b) => b.boosts - a.boosts);

container.innerHTML = `
  <h1 style="font-weight: 300; font-size: 28px;">🔮 History of boosters 🔮</h1>
  <div class="boosters-summary-info">
  <p><strong>Total:</strong> ${totalBoosts} 🚀</p>
  <p><strong>Total value:</strong> ${boosters_value} USD (4.99$/each)</p>
  <p><strong>Last updated:</strong> ${formattedDate} (Europe/Warsaw)</p>
  </div>
`;

// Render top 3 without id "0"
for (let i = 0; i < 3 && i < visibleBoosters.length; i++) {
  const medal = ["🥇", "🥈", "🥉"][i];
  const booster = visibleBoosters[i];
  container.innerHTML += `
  <h1 style="font-weight: 300; font-size: 28px; color: var(--tos-h1-discord); padding-top: 0.5em;">
  ${medal} TOP ${i + 1}</h1>
      <p>@${booster.id}<br><strong>${booster.boosts}</strong> 🚀</p>
  `;
}

// Render rest of leaderboard without id "0"
let rest = "";
for (let i = 3; i < visibleBoosters.length; i++) {
  const booster = visibleBoosters[i];
  rest += `${i + 1}. @${booster.id} - <strong>${booster.boosts}</strong> 🚀<br>`;
}

container.innerHTML += `
    <h1 style="font-weight: 300; font-size: 28px; color: var(--tos-h1-discord); padding-top: 0.5em;">🚀 Leaderboard</h1>
    <p>${rest}</p>
  <div class="boosters-footer-info">
  ⚠ Statistics are tracked manually and may differ from Discord’s official boost counts. Boosts are counted by transfers, and since 2025 also by duration. If a user deletes or deactivates their account, their stats are removed, but their contributions remain in the total boost count. Personal statistics can be permanently deleted on request. Due to technical limits, only user IDs are shown.
  </div>
`;
