document.addEventListener("DOMContentLoaded", () => {
  const API_KEY = '84cd682549a0588428749eeaed02d8e7';
  const BASE_URL = 'https://api.themoviedb.org/3';
  const IMAGE_BASE = 'https://image.tmdb.org/t/p/w300';

  const movieList = document.querySelector(".movie-list");
  const serieList = document.querySelector(".serie-list");
  const searchForm = document.querySelector("form");
  const searchInput = document.getElementById("search");

  function criarCard(item, tipo, duration = "N/A"){
    
  }