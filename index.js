let eventData = []; 

function fetchData() {
    const xhr = new XMLHttpRequest();
    //const url = "http://localhost:8080/matches"; 
    const url = "https://api-jakefutbol.redpos.app/matches"

    xhr.open("GET", url, true);
    
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4 && xhr.status === 200) {
            let eventDataTmp = JSON.parse(xhr.responseText); 
            if (Array.isArray(eventData)) {
                eventData = filterAndSort(eventDataTmp);
                console.log(eventData);
                renderTable(eventData);
            }
        }
    };
    
    xhr.send();
}

function renderTable(data) {
    const tableBody = document.querySelector("tbody");
    tableBody.innerHTML = ""; 

    data.forEach((event, index) => {
        const row = document.createElement("tr");
        row.dataset.index = index;
        row.classList.add("cursor-pointer"); 

        row.innerHTML = `
            <td>${event.hour}</td>
            <td>${event.title}</td>
        `;

        const detailRow = document.createElement("tr");
        detailRow.classList.add("detail-row", "d-none"); 
        detailRow.innerHTML = `
            <td colspan="2" class="bg-light">
                ${event.links.map((link, i) => 
                    `<a class='text-decoration-none d-block py-2 border-bottom' href="channel/channel.html?eventId=${event.id}&option=${i}" target="_blank">
                        Play ${i + 1}
                    </a>`
                ).join("")}
            </td>
        `;

        tableBody.appendChild(row);
        tableBody.appendChild(detailRow);

        row.addEventListener("click", () => {
            detailRow.classList.toggle("d-none");
        });
    });
}

function filterAndSort(list) {
    return list
        .filter(item => !item.id.includes("channel"))
        .sort((a, b) => {
            if (a.hour === "always") return 1; 
            if (b.hour === "always") return -1;
            return a.hour.localeCompare(b.hour); 
        });
}

function filterEvents() {
    const searchInput = document.getElementById("searchEvent").value.toLowerCase();
    const filteredData = eventData.filter(event => event.title.toLowerCase().includes(searchInput));
    renderTable(filteredData);
}

document.getElementById("searchEvent").addEventListener("input", filterEvents);

document.addEventListener("DOMContentLoaded", fetchData);
