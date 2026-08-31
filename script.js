const API_URL = "https://libre-y-theta.vercel.app/api.php";

const form = document.getElementById("searchForm");
const input = document.getElementById("searchInput");
const resultsContainer = document.getElementById("results");
const status = document.getElementById("status");
const pagination = document.getElementById("pagination");
const previousButton = document.getElementById("previousButton");
const nextButton = document.getElementById("nextButton");
const pageNumber = document.getElementById("pageNumber");
const clearButton = document.getElementById("clearButton");
const tabs = [...document.querySelectorAll(".tab")];

let currentQuery = "";
let currentPage = 0;
let currentType = 0;
let controller = null;

form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = input.value.trim();
    if (!query) return;
    currentQuery = query;
    currentPage = 0;
    updateURL();
    search();
});

input.addEventListener("input", () => {
    clearButton.hidden = !input.value;
});

clearButton.addEventListener("click", () => {
    input.value = "";
    input.focus();
    clearButton.hidden = true;
});

previousButton.addEventListener("click", () => {
    if (currentPage <= 0) return;
    currentPage--;
    updateURL();
    search();
});

nextButton.addEventListener("click", () => {
    currentPage++;
    updateURL();
    search();
});

tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        currentType = Number(tab.dataset.type);
        tabs.forEach((item) => item.classList.toggle("active", item === tab));
        if (currentQuery) {
            currentPage = 0;
            updateURL();
            search();
        }
    });
});

async function search() {
    if (controller) controller.abort();
    controller = new AbortController();

    resultsContainer.innerHTML = `
        <div class="loading" aria-label="Searching">
            <span></span><span></span><span></span>
        </div>`;
    status.textContent = `Searching for “${currentQuery}”…`;
    pagination.hidden = true;

    const params = new URLSearchParams({ q: currentQuery, p: currentPage, t: currentType });
    const url = `${API_URL}?${params.toString()}`;
    console.log("LibreY request:", url);

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: { Accept: "application/json" },
            signal: controller.signal
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log("LibreY response:", data);
        renderResults(data);
    } catch (error) {
        if (error.name === "AbortError") return;
        console.error(error);
        status.textContent = "Search failed";
        resultsContainer.innerHTML = `<div class="error"><strong>Something went wrong.</strong><p>LibreY could not be reached directly. Please try again.</p><button type="button" onclick="search()">Try again</button></div>`;
    }
}

function renderResults(data) {
    resultsContainer.innerHTML = "";
    const results = getResultsArray(data);
    if (results.length === 0) {
        status.textContent = data?.error?.message || "No results found.";
        return;
    }

    status.textContent = `${results.length} results for “${currentQuery}”`;

    for (const result of results) {
        if (!result || (!result.title && !result.url && !result.description)) continue;
        const title = result.title ?? result.name ?? "Untitled";
        const url = result.url ?? result.link ?? result.href ?? "#";
        const description = result.description ?? result.snippet ?? result.content ?? "";
        const element = document.createElement("article");
        element.className = "result";

        const host = getHostname(url);
        element.innerHTML = `
            <div class="result-site">${escapeHTML(host)}</div>
            <h2 class="result-title"><a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(title)}</a></h2>
            <div class="result-url">${escapeHTML(url)}</div>
            <div class="result-description">${escapeHTML(description)}</div>`;
        resultsContainer.appendChild(element);
    }

    pagination.hidden = false;
    pageNumber.textContent = `Page ${currentPage + 1}`;
    previousButton.disabled = currentPage === 0;
}

function getResultsArray(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.items)) return data.items;
    if (data && typeof data === "object") {
        return Object.keys(data)
            .filter(key => /^\d+$/.test(key))
            .sort((a, b) => Number(a) - Number(b))
            .map(key => data[key]);
    }
    return [];
}

function getHostname(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); }
    catch { return ""; }
}

function updateURL() {
    const params = new URLSearchParams();
    if (currentQuery) params.set("q", currentQuery);
    if (currentPage > 0) params.set("p", currentPage);
    if (currentType > 0) params.set("t", currentType);
    const query = params.toString();
    history.replaceState(null, "", query ? `${location.pathname}?${query}` : location.pathname);
}

function escapeHTML(value) {
    const element = document.createElement("div");
    element.textContent = String(value);
    return element.innerHTML;
}

function loadFromURL() {
    const params = new URLSearchParams(location.search);
    const query = params.get("q");
    const page = parseInt(params.get("p") || "0", 10);
    const type = parseInt(params.get("t") || "0", 10);
    currentType = [0, 1, 2].includes(type) ? type : 0;
    tabs.forEach(tab => tab.classList.toggle("active", Number(tab.dataset.type) === currentType));
    if (!query) return;
    currentQuery = query;
    currentPage = Number.isNaN(page) ? 0 : Math.max(0, page);
    input.value = query;
    clearButton.hidden = false;
    search();
}

loadFromURL();
