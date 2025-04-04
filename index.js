let eventsDataToday = [];
let eventsDataNext = [];
let channelsData = [];

async function fetchData() {
    try {
        let API = `${HOSTS.API_DATA}/generic`
        const response = await fetch(API);
        if (!response.ok) throw new Error(`Error en la API: ${response.status}`);

        const data = await response.json();

        if (data && data.categories) {
            const { eventsToday, eventsNext } = filterEventsDataFromAPI(data.categories);
            eventsDataToday = eventsToday;
            eventsDataNext = eventsNext;
            channelsData = data.channels;
            renderTable(eventsDataToday, 'tBodyToday');
            renderTable(eventsDataNext, 'tBodyNext', true);
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
    const xHoursAgoTime = nowTime - X_HOUR * 3600 * 1000;

    data.forEach(category => {
        if (!category.championShips) return;

        category.championShips.forEach(championship => {

            championship.matchDays
                .forEach(matchDay => {
                    matchDay.matchs.forEach(match => {
                        if (!match.dateTime || match.dateTime.trim() === "") return;

                        const [matchDateStr, matchTimeStr] = match.dateTime.split(" ");
                        if (!matchTimeStr || matchDateStr !== todayStr) return;

                        const [matchHours, matchMinutes] = matchTimeStr.split(":").map(Number);
                        const matchDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), matchHours, matchMinutes);

                        if (matchDateTime.getTime() >= xHoursAgoTime) {
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
                    eventsNext.push(...nextMatches.slice(0, X_RECORDS_ADDITIONAL).map(match => ({ ...match, championshipName: championship.name })));
                    foundMatches = true;
                }
            });

            if (!foundMatches) {
                const nextMatchDayNumber = Number(championship.currentMatchDay) + 1;

                championship.matchDays
                    .filter(matchDay => Number(matchDay.number) === nextMatchDayNumber)
                    .forEach(matchDay => {
                        const nextMatches = matchDay.matchs.filter(match => match.dateTime && match.dateTime.trim() !== "").slice(0, X_RECORDS_ADDITIONAL);

                        eventsNext.push(...nextMatches.map(match => ({ ...match, championshipName: championship.name })));
                    });
            }
        });
    });

    eventsToday.sort((a, b) => parseDateTime(a.dateTime) - parseDateTime(b.dateTime));
    eventsNext.sort((a, b) => parseDateTime(a.dateTime) - parseDateTime(b.dateTime));
    return { eventsToday, eventsNext };
}

function parseDateTime(dateTimeStr) {
    const [dateStr, timeStr] = dateTimeStr.split(" ");
    const [day, month, year] = dateStr.split("/").map(Number);
    const [hours, minutes] = timeStr.split(":").map(Number);

    return new Date(year, month - 1, day, hours, minutes);
}

function renderTable(data, tableId, showDate = false) {
    const tableBody = document.getElementById(tableId);
    tableBody.innerHTML = "";

    if (!data.length) {
        tableBody.innerHTML = `<tr><td colspan="2" class="text-center">No hay eventos disponibles</td></tr>`;
        return;
    }

    data.forEach(match => {
        const [matchDateStr, matchTimeStr] = match.dateTime.split(" ");
        const matchDisplayTime = showDate ? `${matchDateStr} ${matchTimeStr.slice(0, 5)}` : matchTimeStr.slice(0, 5);

        const row = document.createElement("tr");
        row.classList.add("cursor-pointer");
        row.innerHTML = `
            <td class='text-center'>${matchDisplayTime}</td>
            <td><strong>${match.championshipName}</strong>: ${match.homeTeam} vs ${match.visitingTeam}</td>
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

function renderChannels(data) {
    const containerNavBar = document.getElementById('containerNavBar');
    containerNavBar.innerHTML = '';
    data.forEach(channel => {
        if (channel.show === 'Y' && channel.links.length > 0) {
            const li = document.createElement("li");
            li.classList.add("cursor-pointer");
            li.innerHTML = `
                <a href="channel/channel.html?channelId=${channel.id}&linkId=${channel.links[0].id}"
                                    target="_blank" class="nav-link">
                        ${channel.name}
                    </a>`;
            containerNavBar.append(li)
        }

    })

}

document.getElementById("searchEvent").addEventListener("input", searchEvents);
document.addEventListener("DOMContentLoaded", fetchData);
