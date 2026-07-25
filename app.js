const events = [
  {
    title: "Sui Workshop",
    date: "2025-10-22",
    time: "18:00",
    place: "Bilgisayar ve Bilişim Bilimleri Fakültesi",
    type: "Workshop",
    desc: "Blockchain, NFT ve akıllı Kontratlar dünyasını keşfetmeye hazır mısın?",
    image: "image/100.jpeg"
  },
  {
    title: "Bilişim Vadisi Teknik Gezisi",
    date: "2026-02-17",
    time: "14:00",
    place: "Bilişim Vadisi",
    type: "Teknik Gezi",
    desc: "",
    link: "#",
    image: "image/95.jpeg" 
  },
  {
    title: "Mezunlarla İş Bulma Süreci",
    date: "2025-12-12",
    time: "19:00",
    place: "Greenwich Cafe",
    type: "Söyleşi",
    desc: "Mezuniyet sonrası o meşhur ilk 6 ayın tüm spoiler'ları masada!",
    image: "image/80.jpeg"
  },
  {
    title: "Hackathon 2025",
    date: "2025-12-19",
    time: "19:00",
    place: "Konferans Personel Yemekhanesi",
    type: "Hackathon",
    desc: "Etkinliğin sonunda staj imkanı sizi bekliyor!",
    image: "image/90.jpeg"
  },
  {
    title: "Quiz Night",
    date: "2025-10-17",
    time: "18:30",
    place: "Bonne Vıe",
    type: "Quiz Night",
    desc: "Eğlence, kahkaha ve yarışma dolu bir gece için tek ihtiyacımız var: SEN! Aramıza bekleriz.",
    image: "image/70.jpeg"
  },
  {
    title: "Aris Workshop",
    date: "2026-03-04",
    time: "",
    place: "Bilgisayar ve Bilişim Bilimleri Fakültesi",
    type: "Workshop",
    desc: "",
    image: "image/60.jpeg"
  }
];

const $ = (s) => document.querySelector(s);

const eventsTrack = $("#eventsTrack");
const pastTrack = $("#pastTrack");
const nextEventBox = $("#nextEvent");
const statEvents = $("#statEvents");

const tsOf = (d) => new Date(d + "T00:00:00").getTime();

function formatTR(dateStr){
  return new Date(dateStr + "T00:00:00")
    .toLocaleDateString("tr-TR", { day:"2-digit", month:"long", year:"numeric" });
}

function startOfTodayTs(){
  return new Date(new Date().toDateString()).getTime();
}

function renderEventCards(list, target){
  if (!target) return;

  if (!list.length){
    target.innerHTML = `<p class="muted">Etkinlik bulunamadı.</p>`;
    return;
  }

  target.innerHTML = list.map(e => `
    <article class="card event-card">
      ${e.image ? `<img class="event-photo" src="${e.image}" alt="${e.title}">` : ""}
      <span class="badge">${e.type}</span>
      <h3>${e.title}</h3>
      ${e.desc ? `<p>${e.desc}</p>` : `<p class="muted"></p>`}
      <div class="meta">
        <span class="pill">📅 ${formatTR(e.date)} • ${e.time}</span>
        <span class="pill">📍 ${e.place}</span>
        ${e.link ? `<a class="pill" href="${e.link}" target="_blank" rel="noreferrer">Kayıt / Detay</a>` : ""}
      </div>
    </article>
  `).join("");
}

function splitEvents(){
  const todayTs = startOfTodayTs();
  const upcoming = [];
  const past = [];

  for (const e of events){
    (tsOf(e.date) >= todayTs ? upcoming : past).push(e);
  }

  upcoming.sort((a,b) => tsOf(a.date) - tsOf(b.date));
  past.sort((a,b) => tsOf(b.date) - tsOf(a.date));

  return { upcoming, past };
}

function renderNextEvent(upcoming){
  if (!nextEventBox) return;

  if (!upcoming.length){
    nextEventBox.innerHTML = `<p class="muted">Şu an yaklaşan etkinlik yok. Yakında duyuracağız.</p>`;
    return;
  }

  const next = upcoming[0];
  nextEventBox.innerHTML = `
    <div class="badge">📌 ${next.type}</div>
    <h4 style="margin:0">${next.title}</h4>
    <div class="muted">📅 ${formatTR(next.date)} • ${next.time}</div>
    <div class="muted">📍 ${next.place}</div>
    ${next.link ? `<a class="btn btn-small" href="${next.link}" target="_blank" rel="noreferrer">Kayıt Ol</a>` : ""}
  `;
}

function setupSlider(trackSel, prevSel, nextSel, cardSel, fallbackWidth){
  const track = $(trackSel);
  const prev = $(prevSel);
  const next = $(nextSel);
  if (!track || !prev || !next) return;

  const scrollAmount = () => {
    const first = track.querySelector(cardSel);
    return first ? first.getBoundingClientRect().width + 14 : fallbackWidth;
  };

  prev.addEventListener("click", () => {
    track.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
  });

  next.addEventListener("click", () => {
    track.scrollBy({ left: scrollAmount(), behavior: "smooth" });
  });
}

function setupMenu(){
  const btn = $("#menuBtn");
  const nav = $("#nav");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => nav.classList.toggle("open"));
  nav.querySelectorAll("a").forEach(a => {
    a.addEventListener("click", () => nav.classList.remove("open"));
  });
}

function init(){
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  if (statEvents) statEvents.textContent = String(events.length);

  const { upcoming, past } = splitEvents();

  renderEventCards(upcoming, eventsTrack);
  renderEventCards(past, pastTrack);
  renderNextEvent(upcoming);

  setupMenu();

  setupSlider("#eventsTrack", "#eventsPrev", "#eventsNext", ".event-card", 340);
  setupSlider("#pastTrack", "#pastPrev", "#pastNext", ".event-card", 340);
  setupSlider("#teamTrack", "#teamPrev", "#teamNext", ".card", 320);
}

const bgImages = [
  "image/100.jpeg",
  "image/95.jpeg",
  "image/80.jpeg"
];

bgImages.forEach(src => {
  const img = new Image();
  img.src = src;
});

let currentBgIndex = 0;

const heroSection = document.getElementById("home"); 

function changeBackground() {
  if (heroSection) {
   
    heroSection.style.backgroundImage = `linear-gradient(rgba(11, 16, 30, 0.6), rgba(11, 16, 30, 0.6)), url('${bgImages[currentBgIndex]}')`;
    currentBgIndex = (currentBgIndex + 1) % bgImages.length;
  }
}

changeBackground();

setInterval(changeBackground, 3000);

init();