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
            loadDataFrame()
        }
        
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
            
        });
    });
    eventsToday.sort((a, b) => parseDateTime(a.dateTime) - parseDateTime(b.dateTime));
    return { eventsToday, eventsNext };
}

function parseDateTime(dateTimeStr) {
    const [dateStr, timeStr] = dateTimeStr.split(" ");
    const [day, month, year] = dateStr.split("/").map(Number);
    const [hours, minutes] = timeStr.split(":").map(Number);

    return new Date(year, month - 1, day, hours, minutes);
}

async function loadDataFrame() {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get("matchId");
    const channelId = params.get("channelId");
    const linkId = params.get("linkId");

    if (!linkId) return console.warn("No se encontró el parámetro 'linkId' en la URL");

    const { objectId, data } = matchId ? 
        { objectId: matchId, data: eventsDataToday } : 
        channelId ? 
        { objectId: channelId, data: channelsData } : 
        {};

    if (!objectId || !data) return console.warn("No se encontró un 'matchId' ni 'channelId' válidos en la URL");

    const event = data.find(item => item.id === objectId);
    if (!event) return console.warn(`No se encontró un evento con el ID: ${objectId}`);

    const link = event.links?.find(item => item.id === linkId);
    if (!link) return console.warn(`No se encontró un enlace válido para el linkId: ${linkId}`);
    updateIframe(link.url)
}


function updateIframe(url) {
    document.getElementById("frameView").src = url;
}

document.addEventListener("DOMContentLoaded", fetchData);
