let eventsData = [];
let channelsData = []

async function fetchData() {
    try {
        const response = await fetch(HOST);
        if (!response.ok) throw new Error(`Error en la API: ${response.status}`);

        const data = await response.json();

        if (data && data.categories) {
            const { filteredEvents, channelsEvents } = filterEventsDataFromAPI(data.categories);
            eventsData = filteredEvents;
            channelsData = channelsEvents;
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
    const channelsEvents = [];

    data.forEach(category => {
        if (!category.championShips) return;

        category.championShips.forEach(championship => {
            championship.matchDays
                .filter(matchDay => Number(matchDay.number) === Number(championship.currentMatchDay))
                .forEach(matchDay => {
                    matchDay.matchs.forEach(match => {
                        const event = {
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
                        };

                        if (category.code === "CHA-FUT") {
                            channelsEvents.push(event);
                        } else {
                            filteredEvents.push(event);
                        }
                    });
                });
        });
    });

    return { filteredEvents, channelsEvents };
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

        const filteredLinks = match.links.filter(link => link.isFormat !== 'Y');

        if (filteredLinks.length > 0) {
            const detailRow = document.createElement("tr");
            detailRow.classList.add("detail-row", "d-none");
            detailRow.innerHTML = `
                <td colspan="2" class="bg-light">
                    ${filteredLinks.map(link => `
                        <a class='text-decoration-none d-block py-2 border-bottom' 
                        href="channel/channel.html?matchId=${match.id}&linkId=${link.id}" target="_blank">
                            ${link.name}
                        </a>`).join("")}
                </td>
            `;

            tableBody.append(row, detailRow);
            row.addEventListener("click", () => detailRow.classList.toggle("d-none"));
        } else {
            tableBody.append(row);
        }
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
