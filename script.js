document.addEventListener("DOMContentLoaded", async () => {

  const API_KEY = '84cd682549a0588428749eeaed02d8e7';
  const BASE_URL = 'https://api.themoviedb.org/3';
  const IMAGE_BASE_SMALL = 'https://image.tmdb.org/t/p/w300';

  const movieList = document.querySelector(".movie-list");
  const serieList = document.querySelector(".serie-list");
  const searchForm = document.querySelector("form");
  const searchInput = document.getElementById("search");
  const filterSelect = document.getElementById("filter");
  const spinner = document.getElementById("spinner");

  const showSpinner = () => spinner.style.display = "block";
  const hideSpinner = () => spinner.style.display = "none";

  let generosMap = {};

  async function carregarGenero() {
    const [movieRes, tvRes] = await Promise.all([
      fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=pt-BR`),
      fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}&language=pt-BR`)
    ]);

    const movieData = await movieRes.json();
    const tvData = await tvRes.json();

    [...movieData.genres, ...tvData.genres].forEach(g => {
      generosMap[g.id] = g.name;
    });
  }

  function popularSelectGenero() {
    filterSelect.innerHTML = `<option value="" selected disabled>Filtre por gênero</option>`;

    for (const id in generosMap) {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = generosMap[id];
      filterSelect.appendChild(option);
    }

    // EXIBE SOMENTE MOVIES E TV quando necessário
    filterSelect.addEventListener("change", () => {
      const generoId = filterSelect.value;
      buscarFilmes("movie", "", generoId);
      buscarFilmes("tv", "", generoId);
    });
  }

  function criarCard(item, tipo, duration = "N/A") {
    const card = document.createElement("div");
    card.classList.add(tipo === "movie" ? "movie-card" : "serie-card");

    const title = item.title || item.name;
    const overview = item.overview || "Sem sinopse disponível";
    const ano = (item.release_date || item.first_air_date || "").slice(0, 4);

    const generoText = (item.genre_ids || [])
      .map(id => generosMap[id])
      .filter(Boolean)
      .join(", ") || "Sem gênero";

    card.innerHTML = `
      <div class="img-cards">
          <img src="${item.poster_path ? IMAGE_BASE_SMALL + item.poster_path : '/public/Tela Pop.png'}" alt="${title}" />
      </div>

      <div class="card-body">
        <h3>${title} ${ano ? `(${ano})` : ""}</h3>

        <div class="labels-container">
            <div class="label-card">${generoText}</div>
        </div>

        <p>${overview.substring(0, 50)}...</p>

        <div class="details">
            <p>Tipo: ${tipo === "movie" ? "filme" : "série"}</p>
            <p>${duration}</p>
        </div>

      </div>
    `;

    const button = document.createElement("button");
    button.textContent = "Saber mais";
    button.onclick = () => {
      window.location.href = `details.html?id=${item.id}&type=${tipo}`;
    };

    card.querySelector(".card-body").appendChild(button);
    return card;
  }

  async function buscarDuracao(itemId, tipo) {
    try {
      const url =
        tipo === "movie"
          ? `${BASE_URL}/movie/${itemId}?api_key=${API_KEY}&language=pt-BR`
          : `${BASE_URL}/tv/${itemId}?api_key=${API_KEY}&language=pt-BR`;

      const res = await fetch(url);
      const details = await res.json();

      if (tipo === "movie" && details.runtime) return `${details.runtime} min`;
      if (tipo === "tv" && details.number_of_seasons) return `${details.number_of_seasons} temporadas`;

      return "N/A";
    } catch {
      return "N/A";
    }
  }

  async function buscarFilmes(tipo, query = "", generoId = "") {
    const lista = tipo === "movie" ? movieList : serieList;
    if (!lista) return;

    showSpinner();
    lista.innerHTML = "";

    const anoAtual = new Date().getFullYear();
    let url;

    if (query) {
      url = `${BASE_URL}/search/${tipo}?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`;
    } else if (generoId) {
      url = `${BASE_URL}/discover/${tipo}?api_key=${API_KEY}&language=pt-BR&with_genres=${generoId}`;
    } else {
      url = tipo === "movie"
        ? `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=pt-BR&primary_release_year=${anoAtual}`
        : `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=pt-BR&first_air_date_year=${anoAtual}`;
    }

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!data.results?.length) {
        lista.innerHTML = "<p>Nenhum resultado encontrado.</p>";
        hideSpinner();
        return;
      }

      const vistos = new Set();
      const resultadosUnicos = data.results.filter(item => {
        if (!vistos.has(item.id)) {
          vistos.add(item.id);
          return true;
        }
        return false;
      });

      const finalList = resultadosUnicos.slice(0, 5);

      for (const item of finalList) {
        const duration = await buscarDuracao(item.id, tipo);
        lista.appendChild(criarCard(item, tipo, duration));
      }

    } catch (err) {
      lista.innerHTML = "<p>Erro ao carregar os dados.</p>";
    }

    hideSpinner();
  }

  if (searchForm) {
    searchForm.addEventListener("submit", e => {
      e.preventDefault();
      const query = searchInput.value.trim();

      buscarFilmes("movie", query);
      buscarFilmes("tv", query);
    });
  }

  await carregarGenero();
  popularSelectGenero();

  buscarFilmes("movie");
  buscarFilmes("tv");

});
