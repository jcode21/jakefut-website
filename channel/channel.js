function fetchMatchData() {
    const xhr = new XMLHttpRequest();
    
    //const url = "http://localhost:8080/matches";
    const url = "https://api-jakefutbol.redpos.app/matches";

    xhr.open("GET", url, true);
    
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            eventData = JSON.parse(xhr.responseText); 
            if (Array.isArray(eventData)) {
                loadDataFrame(eventData);
            }
        }
    };
    
    xhr.send();
}

async function loadDataFrame(data) {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get("eventId");
    const option = params.get("option");

    if (!matchId) {
        console.warn("No se encontró el parámetro 'eventId' en la URL");
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

    if (!match.links || !match.links[optionIndex]) {
        console.warn(`No hay enlaces disponibles para la opción ${optionIndex} del evento con ID: ${matchId}`);
        return;
    }

    const originalUrl = match.links[optionIndex].url;

    try {
        new URL(originalUrl); 
    } catch (error) {
        console.warn(`El enlace no es una URL válida: ${originalUrl}`);
        return;
    }

    if (originalUrl) {
        document.getElementById("frameView").src = originalUrl;
        console.log("Iframe actualizado con:", originalUrl);
    } else {
        console.warn("No se pudo obtener la URL final.");
    }
}

document.addEventListener("DOMContentLoaded", fetchMatchData);
