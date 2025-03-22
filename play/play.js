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

    fetchConfigURL(match, match.links[optionIndex]);

}

function fetchConfigURL(match, link) {

    const xhr = new XMLHttpRequest();
    const url = host + `/config-urls/${link.id}`;

    xhr.open("GET", url, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const configData = JSON.parse(xhr.responseText);
            if (configData && configData !== null) {
                fetchToken(configData, match);
            }
        }
    };

    xhr.send();
}

function fetchToken(configData, match) {
    const xhr = new XMLHttpRequest();

    const queryParams = new URLSearchParams(
        configData.queryParams.map(param => [param.name, param.value])
    ).toString();

    const url = `https://${configData.host}/${configData.path}?${queryParams}`;

    xhr.open("GET", url, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const responseText = xhr.responseText;
            if (responseText) {
                const url = extractURL(responseText);
                if (url) {
                    loadStream(url, match);
                }
            }
        }
    };

    xhr.send();
}

function extractURL(responseText) {
    if (typeof responseText !== "string") {
        console.warn("responseText no es un string. Intentando convertirlo...");
        responseText = String(responseText);
    }

    const regex = /var playbackURL = \"(https?:\/\/[^\"]+)\";/;
    const match = responseText.match(regex);

    if (match && match[1]) {
        return match[1];
    }

    console.warn("No se encontró la URL de reproducción en la respuesta");
    return null;
}


function loadStream(url, match) {

    if (url === undefined) {
        console.warn(`No hay enlaces disponibles para el evento con ID: ${match.id}`);
        return;
    }

    const videoSrc = url;

    const video = document.getElementById('videoPlayer');

    if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoSrc);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            console.log("Video listo para reproducir");
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;
    }
    playVideo(video);
    pauseVideo(video);
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
