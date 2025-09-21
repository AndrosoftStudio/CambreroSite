// --- YOUTUBE API SETUP ---
// Esta seção é necessária para o player do YouTube funcionar.
// Ela cria um player global e define funções que a API do YouTube irá chamar.

let player; // Esta variável irá guardar a instância do player do YouTube.
let isPlaying = false; // Rastreia o estado de reprodução atual.

/**
 * Esta função é chamada automaticamente pela API do IFrame Player do YouTube
 * assim que o código da API for baixado e estiver pronto.
 */
function onYouTubeIframeAPIReady() {
    console.log("YouTube API pronta.");
    player = new YT.Player('youtube-player', {
        height: '0', // O player fica escondido.
        width: '0',
        events: {
            'onStateChange': onPlayerStateChange
        }
    });
}

/**
 * Esta função é chamada sempre que o estado do player muda (ex: tocando, pausado, finalizado).
 * Ela atualiza o ícone do botão de play/pause.
 * @param {object} event - O objeto de evento da API do YouTube.
 */
function onPlayerStateChange(event) {
    const playButtonIcon = document.querySelector("#play-anthem-btn i");
    if (!playButtonIcon) return;

    if (event.data == YT.PlayerState.PLAYING) {
        isPlaying = true;
        playButtonIcon.className = 'fas fa-pause-circle'; // Muda para ícone de pause
    } else {
        isPlaying = false;
        playButtonIcon.className = 'fas fa-play-circle'; // Muda para ícone de play
    }
}

/**
 * Alterna a reprodução do vídeo carregado.
 */
function toggleAnthemPlayback() {
    if (player && typeof player.playVideo === 'function') {
        if (isPlaying) {
            player.pauseVideo();
        } else {
            player.playVideo();
        }
    }
}


// --- LÓGICA PRINCIPAL DA APLICAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    // --- Elementos do DOM ---
    const searchButton = document.getElementById("search-button");
    const countryInput = document.getElementById("pais-input");
    const loader = document.getElementById("loader");
    const resultContainer = document.getElementById("result-container");
    const countryCard = document.getElementById("country-card");
    const additionalInfoContainer = document.getElementById("additional-info-container");
    const playAnthemBtn = document.getElementById("play-anthem-btn");
    const countriesModal = new bootstrap.Modal(document.getElementById('countriesModal'));
    const countryListContainer = document.getElementById("country-list-container");
    const showAllCountriesBtn = document.getElementById("show-all-countries-btn");

    // --- Estado & APIs ---
    let areCountriesLoaded = false;
    const REST_COUNTRIES_API = "https://restcountries.com/v3.1/";
    const WIKIPEDIA_API_URL = "https://pt.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&format=json&origin=*&titles=";

    // --- Funções Principais ---
    async function searchCountry() {
        const userInput = countryInput.value.trim();
        if (!userInput) return;

        hideAllResults();
        loader.style.display = "block";
        if (player && typeof player.stopVideo === 'function') {
            player.stopVideo(); // Para qualquer hino anterior
        }

        try {
            const countryData = await fetchCountryData(userInput);
            const wikiSummary = await fetchWikipediaSummary(userInput);
            const anthemVideoId = getAnthemVideoId(countryData.name.common);
            
            displayMainInfo(countryData, anthemVideoId);
            buildTabs(countryData, wikiSummary, userInput);

        } catch (error) {
            showError(error.message);
        } finally {
            loader.style.display = "none";
        }
    }

    async function fetchCountryData(countryName) {
        const response = await fetch(`${REST_COUNTRIES_API}name/${countryName}`);
        if (!response.ok) throw new Error("País não encontrado na base de dados principal.");
        const data = await response.json();
        return data.find(c => c.name.common.toLowerCase() === countryName.toLowerCase()) || data[0];
    }

    function getAnthemVideoId(countryName) {
        // Mapa de hinos para demonstração. O ideal seria uma API de busca.
        const anthemMap = {
            "Brazil": "h-a-w2a-b2E",
            "Portugal": "2F4Kxt3n3mU",
            "Japan": "29FFHC2D128",
            "United States": "M1wLtAXDgqg",
            "Germany": "iX-QaNzd-0A",
            "France": "4K1q9Ntcr5g"
        };
        return anthemMap[countryName] || null;
    }
    
    async function fetchWikipediaSummary(query) {
        try {
            const response = await fetch(WIKIPEDIA_API_URL + encodeURIComponent(query));
            const data = await response.json();
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            if (pageId === "-1") return "Resumo não encontrado na Wikipedia para este termo.";
            const summary = pages[pageId].extract;
            return summary || "Resumo não encontrado ou a página está vazia.";
        } catch (error) {
            console.error("Falha ao buscar resumo da Wikipedia:", error);
            return "Não foi possível carregar o resumo da Wikipedia.";
        }
    }

    function displayMainInfo(data, anthemVideoId) {
        document.getElementById("nome").textContent = data.name.common;
        document.getElementById("capital").textContent = data.capital?.[0] || "N/A";
        document.getElementById("conti").textContent = data.continents?.[0] || "N/A";
        document.getElementById("pop").textContent = data.population.toLocaleString('pt-BR');
        document.getElementById("bandeira").src = data.flags?.svg || "";
        document.getElementById("country-map").src = `https://maps.google.com/maps?q=${encodeURIComponent(data.name.common)}&output=embed&hl=pt`;

        if (anthemVideoId && player) {
            playAnthemBtn.style.display = 'inline-block';
            player.loadVideoById(anthemVideoId);
            playAnthemBtn.onclick = toggleAnthemPlayback;
        } else {
            playAnthemBtn.style.display = 'none';
        }

        resultContainer.style.display = "block";
        countryCard.style.display = "block";
        additionalInfoContainer.style.display = "block";
        setTimeout(() => countryCard.classList.add("show"), 10);
    }

    function buildTabs(data, wikiSummary, originalQuery) {
        const safe = (value, suffix = '') => value ? `${value}${suffix}` : "N/A";
        const wikiLink = `<a href="https://pt.wikipedia.org/wiki/${encodeURIComponent(originalQuery)}" target="_blank">Fonte: Wikipedia</a>`;
        const tabContent = {
            "wiki-pane": `<p>${wikiSummary}</p><p class="mt-3">${wikiLink}</p>`,
            "general-pane": [
                { title: "Nome Oficial", content: safe(data.name.official) },
                { title: "Idiomas", content: data.languages ? Object.values(data.languages).join(', ') : "N/A" },
                { title: "Brasão de Armas", content: data.coatOfArms?.svg ? `<img src="${data.coatOfArms.svg}" style="max-height: 150px; background-color: white; padding: 5px; border-radius: 10px;">` : "N/A" },
            ],
            "geo-pane": [
                { title: "Região", content: safe(data.region) },
                { title: "Sub-região", content: safe(data.subregion) },
                { title: "Área", content: safe(data.area?.toLocaleString('pt-BR'), ' km²') },
                { title: "Fronteiras", content: data.borders?.join(', ') || "Nenhuma" },
            ],
            "eco-pane": [
                 { title: "Moedas", content: data.currencies ? Object.values(data.currencies).map(c => `${c.name} (${c.symbol})`).join(', ') : "N/A" },
                 { title: "Coeficiente GINI", content: data.gini ? `${Object.values(data.gini)[0]} (ano: ${Object.keys(data.gini)[0]})` : "N/A" },
                 { title: "Domínio de Internet", content: data.tld?.join(', ') || "N/A" },
            ]
        };

        for (const paneId in tabContent) {
            const pane = document.getElementById(paneId);
            if (!pane) continue;
            if (paneId === 'wiki-pane') {
                pane.innerHTML = tabContent[paneId];
                continue;
            }
            const accordionId = `accordion-${paneId}`;
            let accordionHTML = `<div class="accordion" id="${accordionId}">`;
            tabContent[paneId].forEach((item, index) => {
                accordionHTML += `
                    <div class="accordion-item">
                        <h2 class="accordion-header">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${paneId}-${index}">${item.title}</button>
                        </h2>
                        <div id="collapse-${paneId}-${index}" class="accordion-collapse collapse" data-bs-parent="#${accordionId}">
                            <div class="accordion-body">${item.content}</div>
                        </div>
                    </div>`;
            });
            accordionHTML += `</div>`;
            pane.innerHTML = accordionHTML;
        }
    }

    function showError(message) {
        const errorDiv = document.getElementById("error-message");
        errorDiv.textContent = message;
        errorDiv.style.display = "block";
    }
    
    function hideAllResults() {
        document.getElementById("error-message").style.display = "none";
        countryCard.style.display = "none";
        additionalInfoContainer.style.display = "none";
    }
    
    async function setupCountryList() {
        if (areCountriesLoaded) return;
        countryListContainer.innerHTML = '<p class="text-center">Carregando...</p>';
        try {
            const response = await fetch(`${REST_COUNTRIES_API}all?fields=name`);
            if (!response.ok) throw new Error("Não foi possível buscar a lista de países.");
            const countries = await response.json();
            countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
            countryListContainer.innerHTML = '';
            countries.forEach(country => {
                const btn = document.createElement("button");
                btn.className = "country-item";
                btn.textContent = country.name.common;
                btn.onclick = () => {
                    countryInput.value = country.name.common;
                    searchCountry();
                    countriesModal.hide();
                };
                countryListContainer.appendChild(btn);
            });
            areCountriesLoaded = true;
        } catch (error) {
            countryListContainer.innerHTML = `<p class="text-danger">${error.message}</p>`;
        }
    }

    searchButton.addEventListener("click", searchCountry);
    countryInput.addEventListener("keypress", (e) => e.key === "Enter" && searchCountry());
    showAllCountriesBtn.addEventListener('click', setupCountryList);
});
