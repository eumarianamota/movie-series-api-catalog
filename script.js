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

    card.innerHTML =
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
    ;
    return card;
}