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

    loadStream(match.links[optionIndex], match);

}

function loadStream(url, match) {
    if (!url) {
        console.warn(`No hay enlaces disponibles para el evento con ID: ${match.id}`);
        return;
    }

    const video = document.getElementById('my_video_1');

    const proxyUrl = `https://39osta28l0q8tvo4.tamalpsdrtd.lat/v4/variant/VE1gTdz0mLzRnLv52bt9SMhFjdtM3ajFmc09yNzUjY2UWY0QGO0MWLihTMh1iNlRGNtgzYjVWLyIWNkFTY5kzL.m3u8`;

    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(proxyUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            console.log("Video listo para reproducir");
            video.play();
        });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = proxyUrl;
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
