document.addEventListener("DOMContentLoaded", async () => {
  const API_KEY = '84cd682549a0588428749eeaed02d8e7';
  const BASE_URL = 'https://api.themoviedb.org/3';
  const IMAGE_BASE = 'https://image.tmdb.org/t/p/w300';

  const movieList = document.querySelector(".movie-list");
  const serieList = document.querySelector(".serie-list");
  const searchForm = document.querySelector("form");
  const searchInput = document.getElementById("search");


  let generosMap = {};

  async function carregarGenero() {
    const movieGenres = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=pt-BR`);
    const seriesGenres = await fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}&language=pt-BR`);
    
    const movieData = await movieGenres.json();
    const serieData = await seriesGenres.json();

    for (const genero of [...movieData.genres, ...serieData.genres]){
        generosMap[genero.id] = genero.name;
    }
}

  function criarCard(item, tipo, duration = "N/A"){
    const card = document.createElement("div");
    card.classList.add("movie-card");
    const title = item.title || item.name;
    const overview = item.overview || "Sem sinopse disponível";
    const generoText = (item.genre_ids || [])
        .map(id => generosMap[id])
        .filter(Boolean)
        .join(", ") || "Sem gênero";

    const dataLancamento = item.release_date || item.first_air_date || "";
    const ano = dataLancamento ? new Date(dataLancamento).getFullYear() : "N/A";   

    card.innerHTML = `
            <div class="img-cards">
                <img src="${item.poster_path ? IMAGE_BASE + item.poster_path : '/public/Tela Pop.png'} " alt="${title}" />
            </div>

            <div class = "card-body">
            <h3>${title} ${ano !== "N/A" ? `(${ano})`: ""}</h3>

            <div class = "labels-container">
                <div class ="label-card">${generoText || "Sem gênero"}</div>
            </div>

            <p>${overview.substring(0, 150)}...</p>

            <div class="details" > <p>Duração: <span class = "duration">${duration}</span></p> </div>

            <button onclick = "window.location.href=\`details.html?id=${item.id}&type=${tipo}\`"})">Saber mais</button>
        </div>
    </div>
    `;
    return card;
}

async function buscarFilmes(tipo, query = "") { 
    const lista = tipo === "movie" ? movieList : serieList;
    lista.innerHTML = "Carregando...";

    let url = "";
    const anoAtual = new Date().getFullYear();

    if(query){
        url = `${BASE_URL}/search/${tipo}?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`;
    } else{
          if (tipo === "movie") {
        url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=pt-BR&primary_release_year=${anoAtual}&sort_by=popularity.desc`;
      } else {
        url = `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=pt-BR&first_air_date_year=${anoAtual}&sort_by=popularity.desc`;
      }
    }

    try{
        const response = await fetch(url);
        const data = await response.json();
        lista.innerHTML = "";

        if(!data.results || data.results.length === 0){
            lista.innerHTML= "<p>Nenhum resultado encontrado.</p>";
            return;
        }

        const unico = [];
        const vistos = new Set();

        for (const item of data.results){
            if(!vistos.has(item.id)){
                vistos.add(item.id);
                unico.push(item);
            }
            if(unico.length >= 5) break;
        }


        for (const item of unico){
            let duration = "N/A";

            try{
                const detailsUrl = 
                tipo === "movie"
                ? `${BASE_URL}/movie/${item.id}?api_key=${API_KEY}&language=pt-BR`
                : `${BASE_URL}/tv/${item.id}?api_key=${API_KEY}&language=pt-BR`;

                const responseDetails = await fetch(detailsUrl);
                const details = await responseDetails.json();

                if (tipo === "movie" && details.runtime) {
                    duration = `${details.runtime} min`;
                } else if (
                    tipo === "tv" && Array.isArray(details.episode_run_time) && details.episode_run_time.length > 0
                ) {
                    duration = `${details.episode_run_time[0]} min`;
                }
            } catch(err){
                console.error(`Erro ao encontrar a duração de ${tipo} ${item.id}:`, err);
            }

            const card = criarCard(item, tipo, duration);
            lista.appendChild(card);
        }
        } catch (error){
            console.error(error);
            lista.innerHTML = "<p>Erro ao carregar os dados.</p>";
        }
    }

    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        buscarFilmes("movie", query);
        buscarFilmes("tv", query);
});

await carregarGenero();

buscarFilmes("movie");
buscarFilmes("tv");


if(window.location.pathname.includes('details.html')){
    const API_KEY = '84cd682549a0588428749eeaed02d8e7';
    const BASE_URL = 'https://api.themoviedb.org/3';
    const IMAGE_BASE = 'https://image.tmdb.org/t/p/w300';

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id')
    const type = params.get('type');

    async function carregarDetalhes(params) {
        try{
            const resposta = await fetch(`%{BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=pt-BR`);
            const dados = await resposta.json();

            const img = document.querySelector('.img-movie img');
            img.src = dados.poster_path ? `${IMAGE_BASE}${dados.poster_path}` : 'public/Tela Pop.png';
            img.alt = dados.title || dados.name;

            const titulo = document.querySelector('.informations h1');
            titulo.textContent = `${dados.title || dados.name} (${(dados.release_date || dados.first_air_date || '' ).slice(0,4)})`;

            const sinopse = document.querySelector('.sinopse p');
            sinopse.textContent = dados.overview || 'Sinopse não disponível';

            const rate = document.querySelector
            }
        }

    }
}
}
);