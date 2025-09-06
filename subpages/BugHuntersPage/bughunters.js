function renderBugHunters() {
    const container2 = document.getElementById("bh-embed");

    // Defensive: ensure container exists
    if (!container2) {
        console.error("bughunters.js: target element #bh-embed not found in DOM.");
        return;
    }

    // Use namespaced variables from bughunters-data.js
    const _bghunters = typeof bghunters_data !== 'undefined' ? bghunters_data : (typeof bghunters !== 'undefined' ? bghunters : []);
    const _dateSource = typeof bughunters_updatetime !== 'undefined' ? bughunters_updatetime : (typeof updatetime !== 'undefined' ? updatetime : null);
    let date = _dateSource ? new Date(_dateSource) : new Date();
    if (isNaN(date.getTime())) {
        console.warn("bughunters.js: invalid updatetime value, falling back to current date", _dateSource);
        date = new Date();
    }
    const bughunters_value = typeof value !== 'undefined' ? value : 'N/A';

    const formatter = new Intl.DateTimeFormat("pl-PL", {
        timeZone: "Europe/Warsaw",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
    const parts = formatter.formatToParts(date);
    let day, month, year, hour, minute;
    for (const part of parts) {
        if (part.type === "day") day = part.value;
        else if (part.type === "month") month = part.value;
        else if (part.type === "year") year = part.value;
        else if (part.type === "hour") hour = part.value;
        else if (part.type === "minute") minute = part.value;
    }
    const formattedDate = `${day}.${month}.${year} ${hour}:${minute}`;

    // App Testers – always shown, excluded from stats
    const fixedOrder = [
        "448894048586170369",
        "756482164262043720"
    ];

    const specialHunters = _bghunters.filter(b => fixedOrder.includes(b.id));

    // Bug hunters counted in stats
    const visibleHunters = _bghunters.filter(b => b.id !== "0" && !fixedOrder.includes(b.id));

    // Total bugs = only visibleHunters
    const totalBugs = visibleHunters.reduce((sum, b) => sum + (Number(b.bugs) || 0), 0);

    container2.innerHTML = `
    <h1 style="font-weight: 300; font-size: 28px;">👾 BugHunters 👾</h1>
    <div class="bhunters-summary-info">
    <p><strong>Total:</strong> ${totalBugs} errors found (App Tester reports not included).</p>
    <p><strong>Last updated:</strong> ${formattedDate} (Europe/Warsaw)</p>
    </div>
    `;

    // Render App Testers (no bug count)
    if (specialHunters.length > 0) {
        let html = "";
        for (const id of fixedOrder) {
            const hunter = specialHunters.find(h => h.id === id);
            if (!hunter) continue;
            html += `<a target="_blank" href="https://discord.id/?prefill=${hunter.id}">@${hunter.id}</a><br>`;
        }
        container2.innerHTML += `
      <h1 style="font-weight: 300; font-size: 28px; color: var(--tos-h1-discord); padding-top: 0.5em;">
      <img src="https://sayouri.dev/nns/BugHuntersPage/media/AppTesterIcon.png" width="28px" height="28px" alt="[Icon: App Tester Badge]"> App Tester</h1>
      <p>${html}</p>
  `;
    }

    // Badge groups
    function groupByBadge(hunters, min, max, icon, alt, label, width = 28, height = 28) {
        const group = hunters.filter(h => h.bugs >= min && h.bugs < max);
        if (group.length === 0) return;
        let html = "";
        for (const h of group) {
            html += `<a target="_blank" href="https://discord.id/?prefill=${h.id}">@${h.id}</a> – <strong>${h.bugs}</strong> 👾<br>`;
        }
        container2.innerHTML += `
      <h1 style="font-weight: 300; font-size: 28px; color: var(--tos-h1-discord); padding-top: 0.5em;"><img src="${icon}" width="${width}" height="${height}" alt="${alt}"> ${label}</h1>
      <p>${html}</p>
  `;
    }

    // Render badge levels
    groupByBadge(
        visibleHunters,
        20,
        Infinity,
        "https://sayouri.dev/nns/BugHuntersPage/media/BugHunterL3.png",
        "[Icon: BugHunter Level 3 Badge]",
        "BugHunter Level 3",
    );
    groupByBadge(
        visibleHunters,
        5,
        20,
        "https://sayouri.dev/nns/BugHuntersPage/media/BugHunterL2.png",
        "[Icon: BugHunter Level 2 Badge]",
        "BugHunter Level 2",
    );
    groupByBadge(
        visibleHunters,
        1,
        5,
        "https://sayouri.dev/nns/BugHuntersPage/media/BugHunterL1.png",
        "[Icon: BugHunter Level 1 Badge]",
        "BugHunter Level 1",
    );

    container2.innerHTML += `
<div class="bhunters-footer-info">
    <p>These statistics are conducted manually. The data may not be 100% accurate by manually moderating it, the data is
    only an analytical curiosity however we try to keep it as accurate as possible. Thank you for your understanding.</p>
    <p>🧪 <strong>App Testers</strong> are not included in these statistics and are listed separately. They are trusted
    users selected by the server owner to help test internal tools like our apps, bots, and websites.</p>
    <p><em>Please note: App Tester status is invite-only and cannot be requested.</em></p>
    <p><strong>👾 BugHunter Levels</strong></p>
    <p>Levels are based on the number of confirmed bugs found by each user. The more bugs you report, the higher your
    level:<br>
    <ul style="margin-top: 6px; margin-bottom: 6px; padding-left: 20px;">
        <li><strong>Level 1</strong> – 1 to 4 bugs</li>
        <li><strong>Level 2</strong> – 5 to 19 bugs</li>
        <li><strong>Level 3</strong> – 20+ bugs</li>
    </ul>
    </p>
</div>
`;
}

// If the container exists now, render immediately. Otherwise poll briefly until it appears.
if (document.getElementById('bh-embed')) {
    renderBugHunters();
} else {
    let attempts = 0;
    const maxAttempts = 50; // ~10 seconds at 200ms
    const iv = setInterval(() => {
        attempts += 1;
        if (document.getElementById('bh-embed')) {
            clearInterval(iv);
            renderBugHunters();
        } else if (attempts >= maxAttempts) {
            clearInterval(iv);
            console.error('bughunters.js: #bh-embed did not appear after waiting.');
        }
    }, 200);
}