function fetchData() {
    const xhr = new XMLHttpRequest();
    //const url = "http://localhost:8080/matches";
    const url = "https://api-jakefutbol.redpos.app/matches";

    xhr.open("GET", url, true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            eventData = JSON.parse(xhr.responseText);
            if (Array.isArray(eventData)) {
                loadFrame(eventData);
            }
        }
    };

    xhr.send();
}

function loadFrame(data) {
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

    const match = data.find(item => item.id === matchId);

    if (!match) {
        console.warn(`No se encontró un evento con el ID: ${matchId}`);
        return;
    }

    const videoSrc = match.links?.[option];

    if (!videoSrc) {
        console.warn(`No hay enlaces disponibles para el evento con ID: ${matchId}`);
        return;
    }

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

document.addEventListener("DOMContentLoaded", fetchData);
