let eventsDataToday = [];
let eventsDataNext = [];
let channelsData = [];

async function fetchData() {
    try {
        const response = await fetch(HOST);
        if (!response.ok) throw new Error(`Error en la API: ${response.status}`);

        const data = await response.json();

        if (data && data.categories) {
            const { eventsToday, eventsNext } = filterEventsDataFromAPI(data.categories);
            eventsDataToday = eventsToday;
            eventsDataNext = eventsNext;
            channelsData = data.channels;
            renderTable(eventsDataToday, 'tBodyToday');
            renderTable(eventsDataNext, 'tBodyNext');
            renderChannels(channelsData);
        }

        const date = new Date();
        const options = { day: '2-digit', month: 'long', year: 'numeric' };
        document.getElementById("title-agenda").innerText = `Agenda - ${date.toLocaleDateString('es-ES', options)}`;
        document.getElementById("title-agenda-next").innerText = `Próximos Eventos`;
    } catch (error) {
        console.error("Error al obtener datos:", error);
    }
}

function filterEventsDataFromAPI(data) {
    if (!Array.isArray(data)) {
        console.error("Error: 'data' no es una lista válida.", data);
        return { eventsToday: [], eventsNext: [] };
    }

    const eventsToday = [];
    const eventsNext = [];

    const now = new Date();
    const todayStr = now.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    const nowTime = now.getTime();
    const twoHoursAgoTime = nowTime - 2 * 3600 * 1000;

    data.forEach(category => {
        if (!category.championShips) return;

        category.championShips.forEach(championship => {

            championship.matchDays
                .filter(matchDay => Number(matchDay.number) === Number(championship.currentMatchDay))
                .forEach(matchDay => {
                    matchDay.matchs.forEach(match => {
                        if (!match.dateTime || match.dateTime.trim() === "") return;

                        const [matchDateStr, matchTimeStr] = match.dateTime.split(" ");
                        if (!matchTimeStr || matchDateStr !== todayStr) return;

                        const [matchHours, matchMinutes] = matchTimeStr.split(":").map(Number);
                        const matchDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), matchHours, matchMinutes);

                        if (matchDateTime.getTime() >= twoHoursAgoTime) {
                            eventsToday.push({ ...match, championshipName: championship.name });
                        }
                    });
                });

            const nextDay = new Date(now);
            nextDay.setDate(now.getDate() + 1);
            const nextDayStr = nextDay.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

            let foundMatches = false;

            championship.matchDays.forEach(matchDay => {
                if (foundMatches) return;

                const nextMatches = matchDay.matchs.filter(match => {
                    if (!match.dateTime || match.dateTime.trim() === "") return false;

                    const [matchDateStr] = match.dateTime.split(" ");
                    return matchDateStr === nextDayStr;
                });

                if (nextMatches.length > 0) {
                    eventsNext.push(...nextMatches.slice(0, 5).map(match => ({ ...match, championshipName: championship.name })));
                    foundMatches = true;
                }
            });

            if (!foundMatches) {
                const nextMatchDayNumber = Number(championship.currentMatchDay) + 1;

                championship.matchDays
                    .filter(matchDay => Number(matchDay.number) === nextMatchDayNumber)
                    .forEach(matchDay => {
                        const nextMatches = matchDay.matchs.filter(match => match.dateTime && match.dateTime.trim() !== "").slice(0, 5);

                        eventsNext.push(...nextMatches.map(match => ({ ...match, championshipName: championship.name })));
                    });
            }
        });
    });

    return { eventsToday, eventsNext };
}

function renderTable(data, tableId) {
    const tableBody = document.getElementById(tableId);
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

        tableBody.appendChild(row);
    });
}

function searchEvents() {
    const searchInput = document.getElementById("searchEvent").value.toLowerCase();
    if (!eventsDataToday.length) {
        console.warn("No hay datos de eventos cargados.");
        return;
    }

    const filteredData = eventsDataToday.filter(event =>
        event.championshipName.toLowerCase().includes(searchInput) ||
        event.homeTeam.toLowerCase().includes(searchInput) ||
        event.visitingTeam.toLowerCase().includes(searchInput)
    );

    renderTable(filteredData, 'tBodyToday');
}

function renderChannels(){
    
}

document.getElementById("searchEvent").addEventListener("input", searchEvents);
document.addEventListener("DOMContentLoaded", fetchData);
