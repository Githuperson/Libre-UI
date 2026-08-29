const API_URL = "https://libre-ui.kkminerishere.workers.dev/api.php";

const form = document.getElementById("searchForm");
const input = document.getElementById("searchInput");
const resultsContainer = document.getElementById("results");
const status = document.getElementById("status");

const pagination = document.getElementById("pagination");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");
const pageNumber = document.getElementById("pageNumber");

let currentQuery = "";
let currentPage = 0;


// Search form
form.addEventListener("submit", (event) => {
    event.preventDefault();

    const query = input.value.trim();

    if (!query) {
        return;
    }

    currentQuery = query;
    currentPage = 0;

    updateURL();
    search();
});


// Previous page
previousButton.addEventListener("click", () => {
    if (currentPage <= 0) {
        return;
    }

    currentPage--;

    updateURL();
    search();
});


// Next page
nextButton.addEventListener("click", () => {
    currentPage++;

    updateURL();
    search();
});


// Search LibreY
async function search() {
    resultsContainer.innerHTML = "";
    status.textContent = "Searching...";
    pagination.hidden = true;

    const params = new URLSearchParams({
        q: currentQuery,
        p: currentPage,
        t: 0
    });

    const url = `${API_URL}?${params.toString()}`;

    console.log("LibreY request:", url);

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        console.log("LibreY response:", data);

        renderResults(data);

    } catch (error) {
        console.error(error);

        status.textContent = "";

        resultsContainer.innerHTML = `
            <div class="error">
                <strong>Search failed.</strong>
                <p>
                    LibreY could not be reached.
                </p>
                <p>
                    Check the browser console for the exact error.
                </p>
            </div>
        `;
    }
}


// Display results
function renderResults(data) {
    resultsContainer.innerHTML = "";

    const results = getResultsArray(data);

    if (results.length === 0) {
        status.textContent = "No results found.";
        return;
    }

    status.textContent =
        `${results.length} results for "${currentQuery}"`;

    for (const result of results) {
        const title =
            result.title ??
            result.name ??
            "Untitled";

        const url =
            result.url ??
            result.link ??
            result.href ??
            "#";

        const description =
            result.description ??
            result.snippet ??
            result.content ??
            "";

        const element = document.createElement("article");

        element.className = "result";

        element.innerHTML = `
            <h2 class="result-title">
                <a
                    href="${escapeHTML(url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    ${escapeHTML(title)}
                </a>
            </h2>

            <div class="result-url">
                ${escapeHTML(url)}
            </div>

            <div class="result-description">
                ${escapeHTML(description)}
            </div>
        `;

        resultsContainer.appendChild(element);
    }

    pagination.hidden = false;

    pageNumber.textContent =
        `Page ${currentPage + 1}`;

    previousButton.disabled =
        currentPage === 0;
}


// Find result array
function getResultsArray(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data.results)) {
        return data.results;
    }

    if (Array.isArray(data.data)) {
        return data.data;
    }

    if (Array.isArray(data.items)) {
        return data.items;
    }

    return [];
}


// Update browser URL
function updateURL() {
    const params = new URLSearchParams();

    params.set("q", currentQuery);

    if (currentPage > 0) {
        params.set("p", currentPage);
    }

    history.replaceState(
        null,
        "",
        `${location.pathname}?${params.toString()}`
    );
}


// Escape HTML
function escapeHTML(value) {
    const element = document.createElement("div");

    element.textContent = String(value);

    return element.innerHTML;
}


// Load search from URL
function loadFromURL() {
    const params = new URLSearchParams(location.search);

    const query = params.get("q");

    const page = parseInt(
        params.get("p") || "0",
        10
    );

    if (!query) {
        return;
    }

    currentQuery = query;

    currentPage = Number.isNaN(page)
        ? 0
        : Math.max(0, page);

    input.value = query;

    search();
}


loadFromURL();
