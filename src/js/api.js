document.addEventListener("DOMContentLoaded", async () => {
  const API_KEY = "84cd682549a0588428749eeaed02d8e7";
  const BASE_URL = "https://api.themoviedb.org/3";
  const IMAGE_BASE_SMALL = "https://image.tmdb.org/t/p/w300";
  const IMAGE_BASE_LARGE = "https://image.tmdb.org/t/p/w500";

  const movieList = document.querySelector(".movie-list");
  const serieList = document.querySelector(".serie-list");

  const prevMovies = document.getElementById("btn-prev-movies");
  const nextMovies = document.getElementById("btn-next-movies");
  const pagesMovies = document.getElementById("pages-movies");

  const prevSeries = document.getElementById("btn-prev-series");
  const nextSeries = document.getElementById("btn-next-series");
  const pagesSeries = document.getElementById("pages-series");

  const searchForm = document.querySelector(".form-search");
  const searchInput = document.getElementById("search");
  const filterSelect = document.getElementById("filter");

  const spinner = document.getElementById("spinner");
  function showSpinner() { if (spinner) spinner.style.display = "block"; }
  function hideSpinner() { if (spinner) spinner.style.display = "none"; }

  let pageMovies = 1;
  let totalPagesMovies = 1;

  let pageSeries = 1;
  let totalPagesSeries = 1;

  let generosMap = {};

 
  async function carregarGenero() {
    try {
      const [mRes, tvRes] = await Promise.all([
        fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=pt-BR`),
        fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}&language=pt-BR`)
      ]);
      const movieData = await mRes.json();
      const tvData = await tvRes.json();

      for (const g of [...(movieData.genres||[]), ...(tvData.genres||[])]) {
        generosMap[g.id] = g.name;
      }
    } catch (err) {
      console.error("Erro ao carregar gêneros:", err);
    }
  }

 
  function popularSelectGenero() {
    if (!filterSelect) return;
    filterSelect.innerHTML = `<option value="" selected disabled>Filtre por gênero</option>`;
    for (const id in generosMap) {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = generosMap[id];
      filterSelect.appendChild(opt);
    }

    filterSelect.addEventListener("change", () => {
      const generoId = filterSelect.value || "";
      pageMovies = 1;
      pageSeries = 1;
      buscarFilmes("movie", "", generoId, pageMovies);
      buscarFilmes("tv", "", generoId, pageSeries);
    });
  }

  
  function criarCard(item, tipo, duration = "N/A") {
    const card = document.createElement("div");
    card.className = "movie-card";

    const title = item.title || item.name || "Sem título";
    const overview = item.overview || "Sem sinopse disponível";
    const generoText = (item.genre_ids || [])
      .map(id => generosMap[id])
      .filter(Boolean)
      .join(", ") || "Sem gênero";

    const dataLanc = item.release_date || item.first_air_date || "";
    const ano = dataLanc ? (new Date(dataLanc)).getFullYear() : "";

    card.innerHTML = `
      <div class="img-cards">
        <img src="${item.poster_path ? IMAGE_BASE_SMALL + item.poster_path : 'src/public/imagem indisponivel.jpeg'}" alt="${title}">
      </div>
      <div class="card-body">
        <h3>${title} ${ano ? `(${ano})` : ""}</h3>
        <div class="labels-container"><div class="label-card">${generoText}</div></div>
        <p>${overview.length > 120 ? overview.slice(0,120) + "..." : overview}</p>
        <div class="details">
          <p>Tipo: ${tipo === "movie" ? "Filme" : "Série"}</p>
          <p>${duration}</p>
        </div>
      </div>
    `;

    const btn = document.createElement("button");
    btn.textContent = "Saber mais";
    btn.addEventListener("click", () => {
      window.location.href = `details.html?id=${item.id}&type=${tipo}`;
    });
    card.querySelector(".card-body").appendChild(btn);

    return card;
  }

  
  async function buscarFilmes(tipo, query = "", generoId = "", page = 1) {
    const lista = tipo === "movie" ? movieList : serieList;
    if (!lista) return;

    showSpinner();
    lista.innerHTML = "";

    let url;
    if (query) {
      url = `${BASE_URL}/search/${tipo}?api_key=${API_KEY}&language=pt-BR&page=${page}&query=${encodeURIComponent(query)}`;
    } else if (generoId) {
      url = `${BASE_URL}/discover/${tipo}?api_key=${API_KEY}&language=pt-BR&with_genres=${generoId}&sort_by=popularity.desc&page=${page}`;
    } else {
      const anoAtual = (new Date()).getFullYear();
      url = tipo === "movie"
        ? `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=pt-BR&primary_release_year=${anoAtual}&sort_by=popularity.desc&page=${page}`
        : `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=pt-BR&first_air_date_year=${anoAtual}&sort_by=popularity.desc&page=${page}`;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (tipo === "movie") totalPagesMovies = data.total_pages || 1;
      else totalPagesSeries = data.total_pages || 1;

      if (!data.results || data.results.length === 0) {
        lista.innerHTML = "<p>Nenhum resultado encontrado.</p>";
        atualizarPaginasUI();
        hideSpinner();
        return;
      }

      const vistos = new Set();
      const unico = data.results.filter(i => {
        if (!vistos.has(i.id)) {
          vistos.add(i.id);
          return true;
        }
        return false;
      });

      
      const mostrar = unico;

     
      for (const item of mostrar) {
        let duration = "N/A";
        try {
          const detUrl = tipo === "movie"
            ? `${BASE_URL}/movie/${item.id}?api_key=${API_KEY}&language=pt-BR`
            : `${BASE_URL}/tv/${item.id}?api_key=${API_KEY}&language=pt-BR`;
          const detRes = await fetch(detUrl);
          const det = await detRes.json();
          if (tipo === "movie" && det.runtime) duration = `${det.runtime} min`;
          if (tipo === "tv" && det.number_of_seasons) duration = `${det.number_of_seasons} temporadas`;
        } catch (err) {
          console.warn("Erro ao buscar detalhes do item:", err);
        }
        const card = criarCard(item, tipo, duration);
        lista.appendChild(card);
      }

      atualizarPaginasUI();

    } catch (err) {
      console.error("Erro ao buscar filmes/séries:", err);
      lista.innerHTML = "<p>Erro ao carregar os dados.</p>";
      atualizarPaginasUI();
    }

    hideSpinner();
  }

  
  function atualizarPaginasUI() {
    if (pagesMovies) pagesMovies.textContent = `${pageMovies} de ${totalPagesMovies}`;
    if (pagesSeries) pagesSeries.textContent = `${pageSeries} de ${totalPagesSeries}`;
    if (prevMovies) prevMovies.disabled = pageMovies <= 1;
    if (nextMovies) nextMovies.disabled = pageMovies >= totalPagesMovies;
    if (prevSeries) prevSeries.disabled = pageSeries <= 1;
    if (nextSeries) nextSeries.disabled = pageSeries >= totalPagesSeries;
  }

  
  if (nextMovies) nextMovies.addEventListener("click", () => {
    if (pageMovies < totalPagesMovies) {
      pageMovies++;
      buscarFilmes("movie", searchInput?.value?.trim() || "", filterSelect?.value || "", pageMovies);
    }
  });
  if (prevMovies) prevMovies.addEventListener("click", () => {
    if (pageMovies > 1) {
      pageMovies--;
      buscarFilmes("movie", searchInput?.value?.trim() || "", filterSelect?.value || "", pageMovies);
    }
  });

  if (nextSeries) nextSeries.addEventListener("click", () => {
    if (pageSeries < totalPagesSeries) {
      pageSeries++;
      buscarFilmes("tv", searchInput?.value?.trim() || "", filterSelect?.value || "", pageSeries);
    }
  });
  if (prevSeries) prevSeries.addEventListener("click", () => {
    if (pageSeries > 1) {
      pageSeries--;
      buscarFilmes("tv", searchInput?.value?.trim() || "", filterSelect?.value || "", pageSeries);
    }
  });

  
  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = searchInput?.value?.trim() || "";
      pageMovies = 1;
      pageSeries = 1;
      buscarFilmes("movie", q, "", pageMovies);
      buscarFilmes("tv", q, "", pageSeries);
    });
  }

  
  await carregarGenero();
  popularSelectGenero();

  if (movieList) buscarFilmes("movie", "", "", pageMovies);
  if (serieList) buscarFilmes("tv", "", "", pageSeries);

  
  if (window.location.href.includes("details.html")) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const type = params.get("type");
    if (!id || !type) {
      console.warn("details.html sem id ou type na URL");
      return;
    }

    async function carregarDetalhes() {
      showSpinner();

      try {
        const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=pt-BR`);
        const dados = await res.json();

        const imgEl = document.querySelector(".img-movie img");
        const titleEl = document.querySelector(".informations h1");
        const generosEl = document.querySelector(".classification");
        const sinopseEl = document.querySelector(".sinopse p");
        const rateEl = document.querySelector(".details span");
        const trailerLink = document.querySelector(".details a");
        const siteLink = document.querySelector(".redirection a");

        
        if (imgEl) {
          if (dados.poster_path) imgEl.src = `${IMAGE_BASE_LARGE}${dados.poster_path}`;
          else imgEl.src = "src/public/Tela Pop.png";
          imgEl.alt = dados.title || dados.name || "Poster";
        }

        if (titleEl) {
          const ano = (dados.release_date || dados.first_air_date || "").slice(0,4);
          titleEl.textContent = `${dados.title || dados.name}${ano ? ` (${ano})` : ""}`;
        }

        if (generosEl) {
          if (Array.isArray(dados.genres) && dados.genres.length) {
            generosEl.innerHTML = dados.genres.map(g => `<div>${g.name}</div>`).join("");
          } else {
            generosEl.innerHTML = "<div>Sem gênero</div>";
          }
        }

    
        if (sinopseEl) sinopseEl.textContent = dados.overview || "Sinopse não disponível.";

        if (rateEl) {
          if (typeof dados.vote_average === "number") {
            rateEl.textContent = `${Math.round(dados.vote_average * 10)}% gostaram`;
          } else {
            rateEl.textContent = "Sem avaliações";
          }
        }

        
        try {
          const vidsRes = await fetch(`${BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}&language=pt-BR`);
          const vids = await vidsRes.json();
          const trailer = Array.isArray(vids.results) ? vids.results.find(v => v.type === "Trailer" && v.site === "YouTube") : null;

          if (trailerLink) {
            if (trailer) {
              trailerLink.href = `https://www.youtube.com/watch?v=${trailer.key}`;
              trailerLink.textContent = "Ver trailer no YouTube";
              trailerLink.target = "_blank";
              trailerLink.rel = "noopener noreferrer";
            } else {
              trailerLink.removeAttribute("href");
              trailerLink.textContent = "Trailer indisponível";
            }
          }
        } catch (err) {
          console.warn("Erro ao buscar vídeos:", err);
          if (trailerLink) {
            trailerLink.removeAttribute("href");
            trailerLink.textContent = "Trailer indisponível";
          }
        }

        if (siteLink) {
          if (dados.homepage) {
            siteLink.href = dados.homepage;
            siteLink.textContent = "Saiba mais no site oficial";
            siteLink.target = "_blank";
            siteLink.rel = "noopener noreferrer";
          } else {
            siteLink.href = `https://www.themoviedb.org/${type}/${id}`;
            siteLink.textContent = "Ver na página da TMDB";
            siteLink.target = "_blank";
            siteLink.rel = "noopener noreferrer";
          }
        }

      } catch (err) {
        console.error("Erro ao carregar detalhes:", err);
      } finally {
        hideSpinner();
      }
    }

    carregarDetalhes();
  }
});
