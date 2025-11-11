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
    <div class="img-cards">
        <img src="${item.poster_path ? IMAGE_BASE + item.poster_path : '/public/Tela Pop.png'} " alt="${title}" />
    </div>
    <div class = "labels-container">
        <div class ="label-card">${generoText || "N/A"}</div>
    </div>
    <h3>${title}</h3>
    <p>${overview.substring(0, 150)}...</p>
    <p>Duração: <span class = "duration">${duration}</span></p>
    <button onclick = "window.open('https://www.themoviedb.org/${tipo}/${item.id}', '_blank')">Saber mais</button>
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

    
}