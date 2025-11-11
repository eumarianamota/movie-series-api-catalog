document.addEventListener("DOMContentLoaded", () => {
  const API_KEY = '84cd682549a0588428749eeaed02d8e7';
  const BASE_URL = 'https://api.themoviedb.org/3';
  const IMAGE_BASE = 'https://image.tmdb.org/t/p/w300';

  const movieList = document.querySelector(".movie-list");
  const serieList = document.querySelector(".serie-list");
  const searchForm = document.querySelector("form");
  const searchInput = document.getElementById("search");

  function criarCard(item, tipo, duration = "N/A"){
    const card = document.createElement(tipo == "movie" ? "movie-card" : "serie-card");
    const title = item.title || item.name;
    const overview = item.overview || "Sem sinopse disponível";
    const generos = item.genre_ids || [];
    const generoText = generos.join(",");

    card.innerHTML = `
    <div class="movie-list">
        <div class="movie-card">
            <div class="img-cards">
                <img src="${item.poster_path ? IMAGE_BASE + item.poster_path : '/public/Tela Pop.png'} " alt="${title}" />
            </div>

            <h3>${title}</h3>

            <div class = "labels-container">
                <div class ="label-card">${generoText || "Sem gênero"}</div>
            </div>

            <p>${overview.substring(0, 150)}...</p>

            <div class="details" > <p>Duração: <span class = "duration">${duration}</span></p> </div>

            <button onclick = "window.open('https://www.themoviedb.org/${tipo}/${item.id}', '_blank')">Saber mais</button>
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

        if(!data.results || data.results.lenght === 0){
            lista.innerHTML= "<p>Nenhum resultado encontrado.</p>";
            return;
        }

        const resultados = query ? data.results : data.results.slice(0, 5);

        for (const item of resultados){
            let duration = "N/A";

            if(tipo === "tv"){
                try{
                    const responseDetails = await fetch(`${BASE_URL}/tv/${item.id}?api_key=${API_KEY}&language=pt-BR`);
                    const details = await responseDetails.json();
                    duration = details.episode_run_time?.lenght ? details.episode_run_time[0] + "min" : "N/A";
                } catch{
                    duration = "N/A";
                }
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

buscarFilmes("movie");
buscarFilmes("tv");

});