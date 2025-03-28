let eventsData = [];
let channelsData = []

async function fetchData() {
    try {
        const response = await fetch(HOST);
        if (!response.ok) throw new Error(`Error en la API: ${response.status}`);

        const data = await response.json();

        if (data && data.categories) {
            eventsData = filterEventsDataFromAPI(data.categories);
            channelsData = data.channels;
            renderTable(eventsData);
            renderChannels(channelsData);
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
        return { filteredEvents: [], channelsEvents: [] };
    }

    console.log("Datos recibidos:", data);

    const filteredEvents = [];

    const now = new Date();
    const todayStr = now.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

    // Obtener la fecha y hora actual en milisegundos
    const nowTime = now.getTime();
    const twoHoursAgoTime = nowTime - 2 * 3600 * 1000; // Restar 2 horas en milisegundos

    data.forEach(category => {
        if (!category.championShips) return;

        category.championShips.forEach(championship => {
            championship.matchDays
                .filter(matchDay => Number(matchDay.number) === Number(championship.currentMatchDay))
                .forEach(matchDay => {
                    matchDay.matchs.forEach(match => {
                        if (!match.dateTime) return;

                        const [matchDateStr, matchTimeStr] = match.dateTime.split(" ");
                        if (!matchTimeStr) return;

                        console.log("Comparando fecha:", matchDateStr, "con", todayStr);

                        if (matchDateStr !== todayStr) return;

                        const [matchHours, matchMinutes, matchSeconds] = matchTimeStr.split(":").map(Number);
                        const matchDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), matchHours, matchMinutes, matchSeconds || 0);

                        console.log("Hora del partido:", matchDateTime.toLocaleTimeString("es-ES"));
                        console.log("Hora actual:", now.toLocaleTimeString("es-ES"));
                        console.log("Hora hace 2 horas:", new Date(twoHoursAgoTime).toLocaleTimeString("es-ES"));

                        // Filtrar solo los partidos dentro del rango válido(van a empezar )
                        if (matchDateTime.getTime() >= twoHoursAgoTime) {
                            filteredEvents.push({
                                id: match.id,
                                dateTime: match.dateTime,
                                homeTeam: match.homeTeam,
                                visitingTeam: match.visitingTeam,
                                result: match.result,
                                isSuspended: match.isSuspended,
                                isFinalized: match.isFinalized,
                                isTop: match.isTop,
                                links: match.links || [],
                                championshipId: championship.id,
                                championshipName: championship.name,
                                championshipSession: championship.session,
                                championshipCurrentMatchDay: championship.currentMatchDay
                            });
                        }
                    });
                });
        });
    });

    return filteredEvents;
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
        const matchTime = match.dateTime.split(" ")[1].slice(0, 5);

        const row = document.createElement("tr");
        row.classList.add("cursor-pointer");
        row.innerHTML = `
            <td>${matchTime}</td>
            <td>${match.championshipName}: ${match.homeTeam} vs ${match.visitingTeam}</td>
        `;

        const filteredLinks = match.links.filter(link => link.isFormat !== 'Y');

        const detailRow = document.createElement("tr");
        detailRow.classList.add("detail-row", "d-none");

        if (filteredLinks.length > 0) {
            detailRow.innerHTML = `
                <td colspan="2" class="bg-light">
                    ${filteredLinks.map(link => `
                        <a class='text-decoration-none d-block py-2 border-bottom' 
                        href="channel/channel.html?matchId=${match.id}&linkId=${link.id}" target="_blank">
                            ${link.name}
                        </a>`).join("")}
                </td>
            `;
        } else {
            detailRow.innerHTML = `
                <td colspan="2" class="text-center text-muted bg-light">
                    Links disponibles minutos antes del evento!
                </td>
            `;
        }

        tableBody.append(row, detailRow);

        row.addEventListener("click", () => detailRow.classList.toggle("d-none"));
    });
}

function renderChannels(data) {
    const navBar = document.getElementById("containerNavBar");
    navBar.innerHTML = '';

    data.forEach(channel => {
        if (!channel.links || channel.links.length === 0) {
            console.warn(`El canal ${channel.id} no tiene enlaces disponibles.`);
            return;
        }

        const link = channel.links[0];

        try {
            new URL(link.url);
        } catch (error) {
            console.warn(`El enlace del canal ${channel.id} no es una URL válida: ${link.url}`);
            return;
        }

        const li = document.createElement("li");
        li.classList.add("nav-item");

        const a = document.createElement("a");
        a.href = `channel/channel.html?matchId=${channel.id}&linkId=${link.id}`;
        a.target = "_blank";
        a.classList.add("nav-link");
        a.textContent = channel.homeTeam;

        li.appendChild(a);
        navBar.appendChild(li);
    });
}

document.getElementById("searchEvent").addEventListener("input", searchEvents);
document.addEventListener("DOMContentLoaded", fetchData);
