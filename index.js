let eventsData = [];

async function fetchData() {
    try {
        const response = await fetch(HOST);
        if (!response.ok) throw new Error(`Error en la API: ${response.status}`);

        const data = await response.json();
        console.log(data);

        if (data && data.categories) {
            eventsData = filterEventsDataFromAPI(data.categories);
            renderTable(eventsData);
        }

        const date = new Date();
        const options = { day: '2-digit', month: 'long', year: 'numeric' };
        document.getElementById("title-agenda").innerText = `Agenda - ${date.toLocaleDateString('es-ES', options)}`;
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

function searchEvents() {
    const searchInput = document.getElementById("searchEvent").value.toLowerCase();
    if (!eventsData.length) {
        console.warn("No hay datos de eventos cargados.");
        return;
    }

    const filteredData = eventsData.filter(event => 
        event.championshipName.toLowerCase().includes(searchInput) ||
        event.homeTeam.toLowerCase().includes(searchInput) ||
        event.visitingTeam.toLowerCase().includes(searchInput)
    );

    renderTable(filteredData);
}

function renderTable(data) {
    const tableBody = document.querySelector("tbody");
    tableBody.innerHTML = "";

    if (!data.length) {
        tableBody.innerHTML = `<tr><td colspan="2" class="text-center">No hay eventos disponibles</td></tr>`;
        return;
    }

    data.forEach(match => {
        const row = document.createElement("tr");
        row.classList.add("cursor-pointer");
        row.innerHTML = `
            <td>${match.dateTime}</td>
            <td>${match.championshipName}: ${match.homeTeam} vs ${match.visitingTeam}</td>
        `;

        const detailRow = document.createElement("tr");
        detailRow.classList.add("detail-row", "d-none");
        detailRow.innerHTML = `
            <td colspan="2" class="bg-light">
                ${match.links.map(link => `
                    <a class='text-decoration-none d-block py-2 border-bottom' 
                    href="channel/channel.html?matchId=${match.id}&linkId=${link.id}" target="_blank">
                        ${link.name}
                    </a>`).join("")}
            </td>
        `;

        tableBody.append(row, detailRow);
        row.addEventListener("click", () => detailRow.classList.toggle("d-none"));
    });
}

document.getElementById("searchEvent").addEventListener("input", searchEvents);
document.addEventListener("DOMContentLoaded", fetchData);
