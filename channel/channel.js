let eventsData = [];

async function fetchData() {
    try {
        const response = await fetch(HOST);
        if (!response.ok) throw new Error(`Error en la API: ${response.status}`);

        const data = await response.json();

        if (!data?.categories) throw new Error("No se encontraron categorías.");

        if (data && data.categories) {
            eventsData = filterEventsDataFromAPI(data.categories);
            loadDataFrame(eventsData);
        }

    } catch (error) {
        console.error("Error al obtener datos:", error);
    }
}

function filterEventsDataFromAPI(data) {
    if (!Array.isArray(data)) {
        console.error("Error: 'data' no es una lista válida.", data);
        return [];
    }

    console.log("Datos recibidos:", data);

    return data
        .filter(category => category.code !== 'CHA-FUT') // Filtrar categorías excluidas
        .flatMap(category => {
            console.log("Procesando categoría:", category.name);
            return category.championShips.flatMap(championship => {
                console.log("  - Procesando campeonato:", championship.name);
                return championship.matchDays
                    .filter(matchDay => Number(matchDay.number) === Number(championship.currentMatchDay)) // Convertir a número
                    .flatMap(matchDay => matchDay.matchs.map(match => ({
                        id: match.id,
                        dateTime: match.dateTime,
                        homeTeam: match.homeTeam,
                        visitingTeam: match.visitingTeam,
                        result: match.result,
                        isSuspended: match.isSuspended,
                        isFinalized: match.isFinalized,
                        isTop: match.isTop,
                        links: match.links,
                        championshipId: championship.id,
                        championshipName: championship.name,
                        championshipSession: championship.session,
                        championshipCurrentMatchDay: championship.currentMatchDay
                    })));
            });
        });
}

async function loadDataFrame(data) {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get("matchId");
    const linkId = params.get("linkId");

    if (!matchId) {
        console.warn("No se encontró el parámetro 'matchId' en la URL");
        return;
    }

    if (!linkId) {
        console.warn("No se encontró el parámetro 'linkId' en la URL");
        return;
    }

    const match = data.find(item => item.id === matchId);

    if (!match) {
        console.warn(`No se encontró un evento con el ID: ${matchId}`);
        return;
    }

    let link = Array.isArray(match.links) ? match.links.find(item => item.id === linkId) : undefined;

    if (!match.links || !link) {
        console.warn(`No hay enlaces disponibles para la opción ${linkId} del evento con ID: ${matchId}`);
        return;
    }

    updateIframe(link.url)
}

function updateIframe(url) {
    try {
        new URL(url);
        document.getElementById("frameView").src = url;
        console.log("Iframe actualizado con:", originalUrl);
    } catch (error) {
        console.warn(`❌ URL inválida: ${url}`);
    }
}

document.addEventListener("DOMContentLoaded", fetchData);
