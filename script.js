document.addEventListener("DOMContentLoaded", async () => {
  const API_KEY = '84cd682549a0588428749eeaed02d8e7';
  const BASE_URL = 'https://api.themoviedb.org/3';
  const IMAGE_BASE_SMALL = 'https://image.tmdb.org/t/p/w300';
  const IMAGE_BASE_LARGE = 'https://image.tmdb.org/t/p/w500';

  const movieList = document.querySelector(".movie-list");
  const serieList = document.querySelector(".serie-list");
  const searchForm = document.querySelector("form");
  const searchInput = document.getElementById("search");
  const filterSelect = document.getElementById("filter");


  let generosMap = {};

  async function carregarGenero() {
    const [movieRes, tvRes] = await Promise.all([
        fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=pt-BR`),
        fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}&language=pt-BR`),
    ]);

    const movieData = await movieRes.json();
    const tvData = await tvRes.json();

    for(const g of [...movieData.genres, ...tvData.genres]){
        generosMap[g.id] = g.name;
    }
}

function popularSelectGenero() {
    if (!filterSelect) return;

    filterSelect.innerHTML = `<option value="" selected disabled>Filtre por gênero</option>`;

    for (const id in generosMap) {
      const option = document.createElement("option");
      option.value = id;
      option.textContent = generosMap[id];
      filterSelect.appendChild(option);
    }

    filterSelect.addEventListener("change", () => {
      const generoId = filterSelect.value;
      buscarFilmes("movie", "", generoId);
      buscarFilmes("tv", "", generoId);
    });
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
                <img src="${item.poster_path ? IMAGE_BASE_SMALL + item.poster_path : '/public/Tela Pop.png'} " alt="${title}" />
            </div>

            <div class = "card-body">
            <h3>${title} ${ano !== "N/A" ? `(${ano})`: ""}</h3>

            <div class = "labels-container">
                <div class ="label-card">${generoText || "Sem gênero"}</div>
            </div>

            <p>${overview.substring(0, 50)}...</p>

            <div class="details" > 
            <p> Tipo: ${tipo === 'movie' ? 'filme' : 'série'} </p>
            <p>Duração: <span class = "duration">${duration}</span></p> 
            </div>

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

async function buscarFilmes(tipo, query = "", generoId = "") { 
    const lista = tipo === "movie" ? movieList : serieList;
    if(!lista) return;
    lista.innerHTML = "Carregando...";

    const anoAtual = new Date().getFullYear();
    let url;

    if (query) {
        url = `${BASE_URL}/search/${tipo}?api_key=${API_KEY}&language=pt-BR&query=${encodeURIComponent(query)}`;
    } else if (generoId) {
        url = `${BASE_URL}/discover/${tipo}?api_key=${API_KEY}&language=pt-BR&with_genres=${generoId}&sort_by=popularity.desc`;
    } else {
        url =
            tipo === "movie"
            ? `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=pt-BR&primary_release_year=${anoAtual}&sort_by=popularity.desc`
            : `${BASE_URL}/discover/tv?api_key=${API_KEY}&language=pt-BR&first_air_date_year=${anoAtual}&sort_by=popularity.desc`;
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

    if(searchForm){
        searchForm.addEventListener("submit", (e) => {
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


    if(window.location.href.includes('details.html')){
    const API_KEY = '84cd682549a0588428749eeaed02d8e7';
    const BASE_URL = 'https://api.themoviedb.org/3';
    const IMAGE_BASE = 'https://image.tmdb.org/t/p/w300';

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id')
    const type = params.get('type');

    if(!id || !type) return;

     async function carregarDetalhes() {
      try {
        const resposta = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=pt-BR`);
        const dados = await resposta.json();

        const img = document.querySelector('.img-movie img');
        const titulo = document.querySelector('.informations h1');
        const generosDiv = document.querySelector('.classification');
        const sinopse = document.querySelector('.sinopse p');
        const rate = document.querySelector('.details span');
        const linkTrailer = document.querySelector('.details a');
        const linkSite = document.querySelector('.redirection a');

        if(img) img.src = dados.poster_path ? `${IMAGE_BASE_LARGE}${dados.poster_path}` : 'public/Tela Pop.png';
        if(img) img.alt = dados.title || dados.name;

        if(titulo) titulo.textContent = `${dados.title || dados.name} (${(dados.release_date || dados.first_air_date || '').slice(0,4)})`;

        if(generosDiv) generosDiv.innerHTML = dados.genres.map(g => `<div>${g.name}</div>`).join('');

        if(sinopse) sinopse.textContent = dados.overview || 'Sinopse não disponível.';

        if(rate) rate.textContent = `${Math.round(dados.vote_average*10)}% gostaram`;


        const respostaVideos = await fetch(`${BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}&language=pt-BR`);
        const videos = await respostaVideos.json();
        const trailer = videos.results.find(v => v.type==="Trailer" && v.site==="YouTube");

        if(linkTrailer){
          if(trailer){
            linkTrailer.href = `https://www.youtube.com/watch?v=${trailer.key}`;
            linkTrailer.textContent = 'Ver trailer no YouTube';
          } else {
            linkTrailer.removeAttribute('href');
            linkTrailer.textContent = 'Trailer indisponível';
          }
        }

        if(linkSite){
          linkSite.href = dados.homepage || `https://www.themoviedb.org/${type}/${id}`;
          linkSite.textContent = dados.homepage ? 'Saiba mais no site oficial' : '';
        }

      } catch(err){
        console.error("Erro ao carregar detalhes:", err);
      }
    }
        
    carregarDetalhes(id, type);
}
       
});