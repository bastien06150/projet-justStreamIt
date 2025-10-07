
const API = "http://127.0.0.1:8000/api/v1";


const bestImage   = document.getElementById("best-image");
const bestTitle   = document.getElementById("best-title");
const bestSummary = document.getElementById("best-summary");
const bestBtn     = document.getElementById("best-btn-details");


const dialog      = document.getElementById("detail-film");
const modalImage  = document.getElementById("modal-image");
const modalTitle  = document.getElementById("modal-title");
const modalSummary= document.getElementById("modal-summary");
const modalGenres = document.getElementById("modal-genres");
const modalRelease= document.getElementById("modal-release");
const modalNote   = document.getElementById("modal-note");      
const modalImdb   = document.getElementById("modal-imdb");
const modalReal   = document.getElementById("modal-real");       
const modalActors = document.getElementById("modal-actors");
const modalDuree  = document.getElementById("modal-duree");      
const modalCountry= document.getElementById("modal-country");
const modalBox    = document.getElementById("modal-boxoffice");


async function loadBestMovie() {
  try {
    const response = await fetch(`${API}/titles/?sort_by=-imdb_score&page_size=1`);
    if (!response.ok) throw new Error("Erreur HTTP " + response.status);
    const data = await response.json();

    const movie = (data.results || [])[0];
    if (!movie) return;
    console.log( movie)
    bestTitle.textContent = movie.title || "Sans titre";
    bestImage.src = movie.image_url || "";
    bestImage.alt = movie.title ? `Affiche du film ${movie.title}` : "Affiche du meilleur film";
    
    bestBtn.dataset.id = movie.id;



    const desc = await fetch(`${API}/titles/${movie.id}`);
    if (!desc.ok) {bestSummary.textContent = "—"; return; }
    const detail = await desc.json();
    bestSummary.textContent = detail.long_description || detail.description || "—";




  } catch (err) {
    console.error(err);
    alert("Impossible de charger le meilleur film");
  }
}


async function openDetails(id) {
  try {
    const response = await fetch(`${API}/titles/${id}`);
    if (!response.ok) throw new Error("Erreur HTTP " + response.status);
    const d = await response.json();
    modalTitle.textContent   = d.title;
    modalImage.src           = d.image_url;
    modalImage.alt           = d.title ? `Affiche du film ${d.title}` : "Affiche du film";
    modalSummary.textContent = d.long_description;

    modalGenres.textContent  = Array.isArray(d.genres) ? d.genres.join(", ") : (d.genres || "—");
    modalRelease.textContent = d.date_published || d.year || "—";
    modalNote.textContent    = d.rated || "—";
    modalImdb.textContent    = d.imdb_score ?? "—";
    modalReal.textContent    = Array.isArray(d.directors) ? d.directors.join(", ") : (d.directors || "—");
    modalActors.textContent  = Array.isArray(d.actors) ? d.actors.join(", ") : (d.actors || "—");
    modalDuree.textContent   = d.duration ? `${d.duration} min` : "—";
    modalCountry.textContent = Array.isArray(d.countries) ? d.countries.join(", ") : (d.countries || "—");
    modalBox.textContent     = d.worldwide_gross_income || d.usa_gross_income || "—";

    if (dialog && typeof dialog.showModal === "function") {
      dialog.showModal();
    }

  } catch (err) {
    console.error(err);
    alert("Impossible de charger la fiche du film");
  }
}

bestBtn.addEventListener('click', () => {
  const id = bestBtn.dataset.id;
  if (id) openDetails(id);
});



function addFilm(film, container) {
  const tpl = document.getElementById("tpl-affiche-film");
  const clone = tpl.content.cloneNode(true);

  const img = clone.querySelector(".affiche");
  img.src = film.image_url;
  const randomId = Math.floor(Math.random() * 900) + 1;
  img.src = `https://picsum.photos/id/${randomId}/300/200`;
  img.alt = `Affiche du film ${film.title}`;

  clone.querySelector(".titre-affiche").textContent = film.title;

  const btn = clone.querySelector(".btn-details");
if (btn) {
  btn.addEventListener("click", () => openDetails(film.id));
}

  container.appendChild(clone);
}

async function loadMovies(containerId, query) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  
  const qs = new URLSearchParams({ page_size: 6, ...query });
  const url = `${API}/titles/?${qs.toString()}`;

  const response = await fetch(url);
  if (!response.ok) return;
  const data = await response.json();

  (data.results || []).forEach(film => addFilm(film, container));
}


async function setupGenreSelect() {
  const select = document.getElementById("select-genre");
  if (!select) return;
  select.innerHTML = '<option value="" disabled selected>Chargement…</option>';

  try {
    const response = await fetch(`${API}/genres/?page_size=25`);
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data = await response.json();

    const genres = (data.results || []).map(g => g.name).sort();
    select.innerHTML = '<option value="" disabled selected>Choisir…</option>';
    for (const name of genres) {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    }
  } catch (e) {
    select.innerHTML = '<option value="" disabled selected>Erreur de chargement</option>';
  }
}

function bindGenreChange() {
  const select = document.getElementById("select-genre");
  if (!select) return;
  select.addEventListener("change", (e) => {
    const genre = e.target.value;
    if (!genre) return;
    loadMoviesAutre("liste-autres", { genre, sort_by: "-imdb_score" });
  });
}

async function loadMoviesAutre(containerId, query) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = "";

  const qs = new URLSearchParams({ page_size: 6, ...query });
  const url = `${API}/titles/?${qs.toString()}`;
  const response = await fetch(url);
  if (!response.ok) return;

  const data = await response.json();
  (data.results || []).forEach(f => addFilm(f, c)); 
}





function setupVoirPlus(containerId, buttonId) {
  const container = document.getElementById(containerId);
  const btn = document.getElementById(buttonId);
  if (!container || !btn) return;

  const isMobile  = () => window.innerWidth < 700;
  const isDesktop = () => window.innerWidth >= 1000;

  let expanded = false; // état courant

  function applyView() {
    const cards = Array.from(container.querySelectorAll(".affiche-film"));
    if (!cards.length) return;

    if (isDesktop()) {
      
      cards.forEach(c => c.classList.remove("hidden"));
      btn.style.display = "none";
      return;
    }

    
    btn.style.display = "block";

    
    const defaultVisible = isMobile() ? 2 : 4; 
    const expandedVisible = 6;

    const limit = expanded ? expandedVisible : defaultVisible;
    cards.forEach((c, i) => c.classList.toggle("hidden", i >= limit));

    btn.textContent = expanded ? "Voir moins" : "Voir plus";
    btn.setAttribute("aria-expanded", String(expanded));
  }

  btn.addEventListener("click", () => {
    expanded = !expanded;
    applyView();
  });

  window.addEventListener("resize", applyView);
  applyView(); 
}


document.addEventListener("DOMContentLoaded", async () => {
  
  loadBestMovie();

  
  await loadMovies("liste-mieux-notes", { sort_by: "-imdb_score" });
  await loadMovies("liste-mystery", { genre: "mystery", sort_by: "-imdb_score" });
  await loadMovies("liste-science-fiction", { genre: "Sci-Fi", sort_by: "-imdb_score" });

  
  setupVoirPlus("liste-mieux-notes", "btn-top-voir-plus");
  setupVoirPlus("liste-mystery", "btn-mystery-voir-plus");
  setupVoirPlus("liste-science-fiction", "btn-science-fiction-voir-plus");
  setupVoirPlus("liste-autres", "btn-autres-voir-plus");

  
  await setupGenreSelect();
  bindGenreChange();
});
