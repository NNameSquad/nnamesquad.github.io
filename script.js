function setSectionParam(action) {
  try {
    const url = new URL(window.location.href);
    const hasSection = url.searchParams.has("section");
    const hasS = url.searchParams.has("s");
    const key = hasSection ? "section" : hasS ? "s" : "section";

    if (action) {
      url.searchParams.set(key, action);
      // ensure the alternative key is removed to avoid duplicates
      if (key === "section") url.searchParams.delete("s");
      if (key === "s") url.searchParams.delete("section");
    } else {
      url.searchParams.delete("section");
      url.searchParams.delete("s");
    }
    window.history.replaceState({}, "", url);
  } catch (_) {
    // ignore URL update errors
  }
}

function clearSectionParam() {
  setSectionParam(null);
}

function openModal(modalId, opts = {}) {
  const syncUrl = !!opts.syncUrl; // default: do NOT sync URL
  // Hide all modals
  document.querySelectorAll(".modal").forEach((m) => {
    m.classList.remove("show");
    m.classList.add("hidden");
  });
  // Show target modal
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("show");
    // If we're opening staff modal, ensure profiles are generated now
    if (modalId === "staff-modal") {
      try {
        fillStaffProfiles();
      } catch (e) {
        console.warn("fillStaffProfiles failed", e);
      }
    }
    // Optionally reflect in URL (?section=<action>) when explicitly requested
    if (syncUrl) {
      const action = (modalId || "").replace(/-modal$/, "");
      if (action) setSectionParam(action);
    }
    // Hide main scrollbar
    document.body.style.overflow = "hidden";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("show");
    modal.classList.add("hidden");
  }
  // clear section from URL when closing explicitly
  clearSectionParam();
  // Restore main scrollbar if no modals are open
  setTimeout(() => {
    if (!document.querySelector(".modal.show")) {
      document.body.style.overflow = "";
    }
  }, 10);
}

// Init handlers and misc on DOM ready
document.addEventListener("DOMContentLoaded", function () {
  // Footer year
  document.querySelectorAll("#current-year").forEach((yearEl) => {
    yearEl.textContent = new Date().getFullYear();
  });

  // Particles (guard if library/file not present)
  try {
    if (window.particlesJS && document.getElementById("particles-canvas")) {
      window.particlesJS.load(
        "particles-canvas",
        "particles.json",
        function () {},
      );
    }
  } catch (e) {
    // no-op
  }

  // Menu card click handlers
  const cards = document.querySelectorAll(".menu-card");
  console.debug("[NNS] menu cards found:", cards.length);

  const titles = {
    homepage: "🏠 Home Page",
    halloffame: "🏆 Hall of Fame",
    roles: "⚙️ Roles Benefits",
    partnerships: "🤝 Partnerships",
    ourbots: "🤖 Our Bots",
    store: "🛒 Server Store",
    collaborators: "🚧 Collaborators",
    staff: "👥 Staff Members",
    contact: "📞 Contact",
    boosters: "🚀 Server Boosters",
    bughunters: "👾 Bug Hunters",
    tos: "📜 Terms & Conditions",
  };

  cards.forEach((card) => {
    card.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const action = card.getAttribute("data-action");
      console.debug("[NNS] card clicked:", action);

      // Open modal if it exists in the DOM
      const modalId = `${action}-modal`;
      if (document.getElementById(modalId)) {
        return openModal(modalId);
      }

      // Unknown action: open 404 modal
      const bodyEl = document.getElementById("notfound-body");
      if (bodyEl && action)
        bodyEl.textContent = `The section "${action}" does not exist.`;
      return openModal("notfound-modal");
    });
  });

  // Attach pulse behavior for 'soon' menu cards
  const soonCards = document.querySelectorAll(".menu-card-soon");
  soonCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      // find the #soon element inside this card only
      const soonEl = card.querySelector("#soon");
      if (!soonEl) return;
      // trigger pulse: add class, then remove when animation ends
      soonEl.classList.remove("soon-pulse");
      // force reflow to restart animation
      void soonEl.offsetWidth;
      soonEl.classList.add("soon-pulse");
    });
  });

  // Deep-link: open modal if ?section=<action>
  function normalizeAction(name) {
    if (!name) return "";
    return String(name)
      .toLowerCase()
      .trim()
      .replace(/^['"]|['"]$/g, "");
  }
  (function openFromQuery() {
    try {
      const params = new URLSearchParams(window.location.search);
      const section = normalizeAction(params.get("section") || params.get("s"));
      if (!section) return;
      const modalId = `${section}-modal`;
      if (document.getElementById(modalId)) {
        openModal(modalId);
      } else {
        // open 404 modal if unknown
        const bodyEl = document.getElementById("notfound-body");
        if (bodyEl)
          bodyEl.textContent = `The section "${section}" does not exist.`;
        openModal("notfound-modal");
      }
    } catch (_) {
      /* no-op */
    }
  })();

  // Close when clicking outside modal-content
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        modal.classList.remove("show");
        modal.classList.add("hidden");
        clearSectionParam();
        setTimeout(() => {
          if (!document.querySelector(".modal.show")) {
            document.body.style.overflow = "";
          }
        }, 10);
      }
    });
  });

  // ESC to close any open modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".modal.show").forEach((m) => {
        m.classList.remove("show");
        m.classList.add("hidden");
      });
      clearSectionParam();
      setTimeout(() => {
        if (!document.querySelector(".modal.show")) {
          document.body.style.overflow = "";
        }
      }, 10);
    }
  });
});

const sectionTitles = {
  section1: "Postanowienia ogólne",
  section2: "Zasady zachowania",
  section3: "Kanały głosowe",
}; // RULES
const rules = {
  section1: [
    "Nieprzestrzeganie regulaminu wiąże się z otrzymaniem kary.",
    "Nieznajomość regulaminu oraz innych zasad obowiązujących na serwerze nie zwalniają cię z obowiązku ich przestrzegania.",
    `Twoim obowiązkiem jest przestrzeganie Wytycznych dla społeczności discord (<a href="https://discord.com/guidelines">https://discord.com/guidelines</a>) oraz Warunków świadczenia usługi discord (<a href="https://discord.com/terms">https://discord.com/terms</a>) ponieważ są one częścią regulaminu.`,
    "Administracja ma prawo do aktualizacji regulaminu.",
    "Administracja może ukarać za rzeczy niezawarte w regulaminie jeżeli uzna, że działa to na szkodę serwera.",
    "Rejoin'y będą skutkować banem.",
    "Konta istniejące mniej niż 24 godziny będą banowane przy próbie dołączenia na serwer.",
    "Aby przebywać na naszym serwerze musisz mieć ukończony 13 rok życia.",
    "Zakazane jest podszywanie się pod użytkowników serwera, osoby publiczne jak i boty.",
    "Zakazane jest posiadanie niewidzialnych/nieoznaczalnych/wulgarnych/nsfw/hoisting awatarów, nicków, statusów sekcji 'O mnie' czy innych części profilu użytkownika.",
    `Zakazana jest kradzież, przywłaszczenie, kopiowanie czy wykorzystywanie jakiegokolwiek rodzaju treści zamieszczonych na naszym serwerze, serwisie/aplikacji, stronie internetowej czy z innych zarządzanymi przez nas miejscach. Wszelkie naruszenia tego typu będą rozpatrywane drogą prawną m.in. na podstawie Art. 115. - 'Naruszenie cudzych praw autorskich'.<br><i style="color: grey; font-size: smaller;">(Dz.U.2022.0.2509 t.j. - Ustawa z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych, Polska).</i>`,
    "Wykorzystywanie multikont w celu zyskania jakichkolwiek korzyści bądź omijania kar jest surowo zabronione, a każde multikonto powinno zostać zgłoszone do administracji.",
    "Korzystanie z selfbot'ów jest kategorycznie zabronione, a ich wykrycie będzie skutkowało bezwarunkowym banem.",
    "Korzystanie z zmodyfikowanego klienta Discord, jego modyfikowanie, bądź posiadanie pluginów wiązać się będzie z bezwarunkowym banem.",
    `Każdy użytkownik może apelować się od nadanej mu kary. Z wyłączeniem kar automatycznych bądź oznaczonych jako "[BMA]". O możliwość apelacji od mute/ban będziecie informowani przez <a>@Dyno#3861</a> w wiadomości prywatnej, więc upewnijcie się że macie możliwość otrzymywania wiadomości prywatnych od użytkowników z naszego serwera.`,
    "Każdy użytkownik może rekrutować się na dostępne stanowiska, o ile spełnia on wymagania.",
    "Każdy użytkownik dołączający na serwer musi dobrać sobie role widoczne w ekranie wprowadzenia. Użytkownicy którzy dołączyli na serwer przed dodaniem ekranu muszą odpalić go za pomocą specjalnego kanału #Kanały i role znajdującego się na samej górze listy kanałów i dobrać sobie role.",
    "Jesteśmy uprzejmi i tolerancyjni dla siebie nawzajem, każdy zasługuje na szacunek.",
  ],
  section2: [
    "Zakazane jest zaśmiecanie chatu w jakikolwiek sposób. Wliczając w to m.in.: spam, flood, caps, masowe/bezcelowe zdjęcia, gify, reakcje.",
    "Zakazane jest przeklinanie w nadmiernych ilościach.",
    "Zakazane jest toksyczne zachowanie (mowa nienawiści, wyzwiska, obrażanie).",
    "Zakazane jest prowokowanie i zachęcanie do łamania regulaminu w jakikolwiek sposób.",
    "Zakazane jest oszukiwanie, wykorzystywanie, szantażowanie, ośmieszanie innych użytkowników.",
    "Zakazane jest NSFW w jakiejkolwiek formie.",
    "Zakazane jest upowszechnianie cudzych danych osobowych (w tym zdjęć, wieku, imienia i innych danych wrażliwych).",
    "Zakazuje się wykorzystywanie błędów administracji, serwera, discorda jak i luk w regulaminie. Wszystkie napotkane błędy należy zgłosić na odpowiednim do tego kanale.",
    "Zakazuje się przeszkadzanie w pracy administracji, a niewykonywanie ich poleceń będzie skutkowało otrzymaniem kary.",
    "Zakazuje się reklamowania się w jakikolwiek sposób (również w wiadomościach prywatnych, bądź wykorzystując swój profil)",
    "Wysyłanie jakichkolwiek linków bez odpowiedniego kontekstu jest zabronione i będą one usuwane. Wyjątek stanowią linki przesyłane przez użytkowników, którzy przeszli personalną weryfikację.",
    `Zakazuje się wysyłania plików bądź poruszania tematów powszechnie uznanych za tematy "tabu" (m.in.: wulgarne, rasistowskie, polityczne, religijne).`,
    "Zakazuje się pingowania użytkowników/administracji/ról bez potrzeby. Masowe wzmianki również są zakazane.",
    "Nakazuje się używania kanałów zgodnie z ich przeznaczeniem.",
    `Nakazuje się używania standardowej czcionki wykorzysującej litery alfabetu łacińskiego. Pisanie w tzw. "custom font" bądź "zalgo" jest zabronione.`,
    "Wymagane jest używanie dozwolonych języków w kanałach tekstowych i głosowych. Aktualnie dozwolone języki można znaleźć w temacie głównego kanału czatu tekstowego.",
  ],
  section3: [
    "Wszystkie zasady obowiązują również na kanałach głosowych.",
    "Zakazane jest przeszkadzanie w rozmowach/słuchaniu muzyki na kanałach głosowych. W tym krzyczenie/zagłuszanie innych.",
    "Zakazane jest puszczanie do mikrofonu muzyki, bądź używanie tzw. bindów.",
    "Zakazane jest nagrywanie użytkowników na kanałach głosowych bez pisemnej zgody wszystkich nagrywanych użytkowników. Chęć nagrywania należy również uprzednio zgłosić do administracji.",
    "Łamanie zasad na kanałach głosowych może skutkować karą w postaci zablokowania ci możliwości korzystania z kanałów VC.",
    "Regulamin obowiązuję również na kanałach prywatnych.",
    "Jeśli ktoś nie posiada mikrofonu, bądź po prostu w danym momencie chcę odpisywać użytkownikom rozmawiającym na kanale vc, powinien skorzystać z przeznaczonego do tego kanału tekstowego.",
  ],
};

function updateRulesContent() {
  const rulesList = document.getElementById("rules-list");
  rulesList.innerHTML = "";

  let sectionIndex = 1;

  for (const section in rules) {
    const sectionElement = document.createElement("ul");
    const sectionTitle = document.createElement("h4");
    const localizedTitle = sectionTitles[section] || section;
    sectionTitle.textContent = `${sectionIndex}. ${localizedTitle}`;
    sectionElement.appendChild(sectionTitle);
    rules[section].forEach((rule, index) => {
      const li = document.createElement("li");
      li.innerHTML = `<strong>${sectionIndex}.${index + 1}§</strong> ${rule}`;
      sectionElement.appendChild(li);
    });
    rulesList.appendChild(sectionElement);
    sectionIndex++;
  }
}

// STAFF PROFILE FILLER
function fillStaffProfiles() {
  if (
    !window.staffData ||
    !Array.isArray(window.staffData) ||
    window.staffData.length === 0
  )
    return;

  // Auto-generate placeholder rows inside #auto-gen-staffusers if present
  const autoGenContainer = document.getElementById("auto-gen-staffusers");
  if (
    autoGenContainer &&
    !autoGenContainer.querySelector(".user-profiles-row")
  ) {
    window.staffData.forEach(() => {
      const row = document.createElement("div");
      row.className = "user-profiles-row";
      const placeholder = document.createElement("div");
      placeholder.className = "staff-profile-card";
      row.appendChild(placeholder);
      autoGenContainer.appendChild(row);
    });
  }

  const cards = Array.from(document.querySelectorAll(".staff-profile-card"));

  function fmtBirthday(birthStr) {
    const d = new Date(birthStr);
    if (isNaN(d)) return { short: "", age: "" };
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return { short: `${day}.${month}`, age: String(age) };
  }

  // small helper that builds the repeated card HTML
  function buildCardHtml(staff) {
    const { short, age } = fmtBirthday(staff.birthday);
    const contactsHtml = renderContactsHtml(staff.contacts || []);
    return `
                <div class="profile-avatar">
                    <img src="media/users-logo/${staff.id}-staff.png" alt="User avatar" onerror="this.onerror=null;this.src='media/ discord.ico'" />
                </div>
                <div class="profile-info">
                    <h3 class="profile-username">${escapeHtml(staff.username || staff.name || "")}</h3>
                    <div class="profile-roles"><span class="role">${escapeHtml(staff.role || "")}</span></div>
                    <p class="profile-desc">${escapeHtml(staff.from || "")}</p>
                    <p class="profile-desc">
                        <strong>Name:</strong> <span id="profile-name">${escapeHtml(staff.name || "")}</span><br />
                        <strong>Age:</strong> <span id="profile-age">${escapeHtml(age)}</span><br />
                        <strong>Birthday:</strong> <span id="profile-birthday">${escapeHtml(short)}</span><br />
                        <strong>Languages:</strong> <span id="profile-languages">${escapeHtml((staff.languages || []).join(", "))}</span><br />
                        <strong>About me:</strong> <span id="profile-about">${escapeHtml(staff.about || "")}</span><br />
                    </p>
                    ${contactsHtml}
                    <p class="profile-desc-id">${escapeHtml(staff.id)}</p>
                </div>
            `;
  }

  if (cards.length > 0) {
    cards.forEach((card, idx) => {
      const idEl = card.querySelector(".profile-desc-id");
      let staff =
        idEl && idEl.textContent.trim()
          ? window.staffData.find((s) => s.id === idEl.textContent.trim())
          : null;
      if (!staff) staff = window.staffData[idx] || null;
      if (!staff) return;
      card.id = staff.id;
      card.innerHTML = buildCardHtml(staff);
    });
    return;
  }

  // fallback: append generated cards into first .user-profiles-row
  const row = document.querySelector(".user-profiles-row");
  if (!row) return;
  const frag = document.createDocumentFragment();
  window.staffData.forEach((staff) => {
    const wrapper = document.createElement("div");
    wrapper.className = "staff-profile-card";
    wrapper.id = staff.id;
    wrapper.innerHTML = buildCardHtml(staff).replace(
      new RegExp(`media/${staff.id}-staff.png`, "g"),
      `media/${staff.id}-staff.png`,
    );
    frag.appendChild(wrapper);
  });
  row.appendChild(frag);
}

// small helper to avoid injecting raw HTML from data
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
  updateRulesContent();
});
window.addEventListener("load", fillStaffProfiles);

// Render contacts as small buttons (email, discord, website, twitter)
function renderContactsHtml(contacts) {
  if (!contacts || !contacts.length) return "";
  const icons = {
    email: "✉️",
    discord: "💬",
    website: "🔗",
    twitter: "🐦",
    instagram: "📸",
    tiktok: "🎵",
    snap: "👻",
    snapchat: "👻",
    twitch: "📺",
    facebook: "📘",
  };
  const parts = contacts
    .map((c) => {
      const t = (c.type || "").toLowerCase();
      const v = String(c.value || "");
      if (!v) return "";
      if (t === "email")
        return `<a class="staff-contact" href="mailto:${escapeHtml(v)}" title="${escapeHtml(v)}">${icons.email}</a>`;
      if (t === "discord")
        return `<span class="staff-contact" title="${escapeHtml(v)}">${icons.discord} ${escapeHtml(v)}</span>`;
      if (t === "website")
        return `<a class="staff-contact" href="${escapeHtml(v)}" target="_blank" rel="noopener" title="${escapeHtml(v)}">${icons.website}</a>`;
      if (t === "twitter")
        return `<a class="staff-contact" href="${escapeHtml(v)}" target="_blank" rel="noopener" title="${escapeHtml(v)}">${icons.twitter}</a>`;
      if (t === "instagram")
        return `<a class="staff-contact" href="${escapeHtml(v)}" target="_blank" rel="noopener" title="Instagram: ${escapeHtml(v)}">${icons.instagram}</a>`;
      if (t === "tiktok")
        return `<a class="staff-contact" href="${escapeHtml(v)}" target="_blank" rel="noopener" title="TikTok: ${escapeHtml(v)}">${icons.tiktok}</a>`;
      if (t === "snap" || t === "snapchat")
        return `<a class="staff-contact" href="${escapeHtml(v)}" target="_blank" rel="noopener" title="Snapchat: ${escapeHtml(v)}">${icons.snap}</a>`;
      if (t === "facebook")
        return `<a class="staff-contact" href="${escapeHtml(v)}" target="_blank" rel="noopener" title="Facebook: ${escapeHtml(v)}">${icons.facebook}</a>`;
      if (t === "twitch")
        return `<a class="staff-contact" href="${escapeHtml(v)}" target="_blank" rel="noopener" title="Twitch: ${escapeHtml(v)}">${icons.twitch}</a>`;
      return `<a class="staff-contact" href="${escapeHtml(v)}" target="_blank" rel="noopener">${icons.website}</a>`;
    })
    .filter(Boolean);
  if (!parts.length) return "";
  return `<div class="profile-contacts">${parts.join(" ")}</div>`;
}
