//const host = "http://localhost:8080";
const host = "https://api-jakefutbol.redpos.app";

function validateRequest() {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get("eventId");
    const option = params.get("option");

    if (!matchId) {
        console.warn("No se encontró el parámetro 'id' en la URL");
        return;
    }

    if (!option) {
        console.warn("No se encontró el parámetro 'option' en la URL");
        return;
    }

    const optionIndex = parseInt(option, 10);

    if (isNaN(optionIndex) || optionIndex < 0) {
        console.warn(`El parámetro 'option' debe ser un número válido (recibido: ${option})`);
        return;
    }

    fetchDataMatch(matchId, optionIndex);
}

function fetchDataMatch(matchId, optionIndex) {
    const xhr = new XMLHttpRequest();
    const url = host + "/matches";

    xhr.open("GET", url, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const matchData = JSON.parse(xhr.responseText);
            if (Array.isArray(matchData)) {
                searchMatch(matchData, matchId, optionIndex);
            }
        }
    };

    xhr.send();
}

function searchMatch(matchData, matchId, optionIndex) {

    const match = matchData.find(item => item.id === matchId);

    if (!match) {
        console.warn(`No se encontró un evento con el ID: ${matchId}`);
        return;
    }

    if (optionIndex > match.links.length) {
        console.warn(`No se encontró la opción ${optionIndex} para el evento con ID: ${matchId}`);
        return;
    }

    fetchToken(match, match.links[optionIndex]);

}

function fetchToken(match, link) {
    const xhr = new XMLHttpRequest();

    const url = `${host}/tokens?id=${link.id}`;

    xhr.open("GET", url, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const tokenData = JSON.parse(xhr.responseText);
            if (tokenData) {
                loadStream(tokenData.url, match);
            }
        }
    };

    xhr.send();
}
function loadStream(url, match) {
    if (!url) {
        console.warn(`No hay enlaces disponibles para el evento con ID: ${match.id}`);
        return;
    }

    const video = document.getElementById('videoPlayer');

    if (Hls.isSupported()) {
        const hls = new Hls({
            xhrSetup: function (xhr, url) {
                console.log("Configurando headers para", url);
                xhr.setRequestHeader("Referer", "https://streamtp3.com");
                xhr.setRequestHeader("Origin", "https://streamtp3.com");
                xhr.setRequestHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36");
                xhr.setRequestHeader("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7");
                xhr.setRequestHeader("Accept-Language", "es-ES,es;q=0.9,en;q=0.8");
                xhr.setRequestHeader("Connection", "keep-alive");
                xhr.setRequestHeader("Cache-Control", "no-cache");
                xhr.setRequestHeader("Pragma", "no-cache");
                xhr.setRequestHeader("Sec-Fetch-Dest", "document");
                xhr.setRequestHeader("Sec-Fetch-Mode", "navigate");
                xhr.setRequestHeader("Sec-Fetch-Site", "same-origin");
            }
        });

        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            console.log("Video listo para reproducir");
            video.play();
        });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.play();
    }
}

function playVideo() {
    const video = document.getElementById('videoPlayer');
    video.play();
}
function pauseVideo() {
    const video = document.getElementById('videoPlayer');
    video.pause();
}

document.addEventListener("DOMContentLoaded", validateRequest);
