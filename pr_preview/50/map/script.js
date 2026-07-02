// ISO 2-letter to ISO 3-letter country code mapping
const ISO2_TO_ISO3 = {
    AU: "AUS", AT: "AUT", BE: "BEL", BR: "BRA", CA: "CAN", CH: "CHE",
    CN: "CHN", CZ: "CZE", DE: "DEU", DK: "DNK", ES: "ESP", FI: "FIN",
    FR: "FRA", GB: "GBR", UK: "GBR", HU: "HUN", IE: "IRL", IL: "ISR",
    IN: "IND", IT: "ITA", JP: "JPN", KR: "KOR", MX: "MEX", NL: "NLD",
    NO: "NOR", NZ: "NZL", PL: "POL", PT: "PRT", RU: "RUS", SE: "SWE",
    SG: "SGP", US: "USA", ZA: "ZAF"
};

// Country name lookup for tooltips
const COUNTRY_NAMES = {
    AUS: "Australia", AUT: "Austria", BEL: "Belgium", BRA: "Brazil",
    CAN: "Canada", CHE: "Switzerland", CHN: "China", CZE: "Czech Republic",
    DEU: "Germany", DNK: "Denmark", ESP: "Spain", FIN: "Finland",
    FRA: "France", GBR: "United Kingdom", HUN: "Hungary", IRL: "Ireland",
    ISR: "Israel", IND: "India", ITA: "Italy", JPN: "Japan", KOR: "South Korea",
    MEX: "Mexico", NLD: "Netherlands", NOR: "Norway", NZL: "New Zealand",
    POL: "Poland", PRT: "Portugal", RUS: "Russia", SWE: "Sweden",
    SGP: "Singapore", USA: "United States", ZAF: "South Africa"
};

const dom = {
    map: document.getElementById("world-map"),
    tooltip: document.getElementById("tooltip"),
    legend: document.getElementById("legend"),
    error: document.getElementById("error"),
    themeToggle: document.getElementById("theme-toggle"),
    detailPanel: document.getElementById("detail-panel"),
    detailOverlay: document.getElementById("detail-overlay"),
    detailTitle: document.getElementById("detail-title"),
    detailCount: document.getElementById("detail-count"),
    detailContent: document.getElementById("detail-content"),
    detailClose: document.getElementById("detail-close"),
    zoomIn: document.getElementById("zoom-in"),
    zoomOut: document.getElementById("zoom-out"),
    zoomReset: document.getElementById("zoom-reset")
};

let selectedCountry = null;
let zoomBehavior = null;
let svg = null;

// Theme toggle
function initThemeToggle() {
    const body = document.body;

    // Check localStorage first, then system preference
    const saved = localStorage.getItem('theme-mode');
    if (saved === 'light') {
        body.classList.add("light");
    } else if (saved !== 'dark') {
        // No saved preference, use system preference
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
            body.classList.add("light");
        }
    }

    function updateLabel() {
        const light = body.classList.contains("light");
        dom.themeToggle.textContent = light ? "🔆" : "🌙";
    }

    updateLabel();
    dom.themeToggle.addEventListener("click", () => {
        body.classList.toggle("light");
        const isLight = body.classList.contains("light");
        localStorage.setItem('theme-mode', isLight ? 'light' : 'dark');
        updateLabel();
    });
}

// Data loading
async function fetchYaml(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load ${path}`);
    const text = await response.text();
    return jsyaml.load(text) || {};
}

// Icon URLs for profile links
const ORCID_ICON = "https://orcid.org/assets/vectors/orcid.logo.icon.svg";
const GITHUB_ICON = "../icons/invertocat.svg";

function aggregateByCountry(people, affMap) {
    const countryCounts = new Map();
    const countryPeople = new Map();
    const countryAffiliations = new Map(); // Store affiliations with their people (as objects)

    people.forEach(person => {
        const affiliations = person.affiliations || [];
        const basedIn = person.based_in || [];
        const seenCountries = new Set();
        const personData = { name: person.name, orcid: person.orcid, github: person.github };

        // Helper to add person to affiliation map (avoids duplicates by name)
        function addToAffMap(iso3, affKey) {
            if (!countryAffiliations.has(iso3)) countryAffiliations.set(iso3, new Map());
            const affMap2 = countryAffiliations.get(iso3);
            if (!affMap2.has(affKey)) affMap2.set(affKey, []);
            if (!affMap2.get(affKey).some(p => p.name === person.name)) {
                affMap2.get(affKey).push(personData);
            }
        }

        // Process affiliations
        affiliations.forEach(fullAff => {
            const entry = affMap.get(fullAff);
            if (!entry || !entry.country_code) return;

            const iso2 = entry.country_code.toUpperCase();
            const iso3 = ISO2_TO_ISO3[iso2];
            if (!iso3) return;

            // Count unique people per country
            if (!seenCountries.has(iso3)) {
                seenCountries.add(iso3);
                countryCounts.set(iso3, (countryCounts.get(iso3) || 0) + 1);
                if (!countryPeople.has(iso3)) countryPeople.set(iso3, []);
                countryPeople.get(iso3).push(person.name);
            }

            // Track affiliations per country
            const affKey = entry.short_name || fullAff;
            addToAffMap(iso3, affKey);
        });

        // Process based_in countries
        basedIn.forEach(iso2Code => {
            const iso3 = ISO2_TO_ISO3[iso2Code.toUpperCase()];
            if (!iso3) return;

            // Count contributor once per country (skip if already counted via affiliation)
            if (!seenCountries.has(iso3)) {
                seenCountries.add(iso3);
                countryCounts.set(iso3, (countryCounts.get(iso3) || 0) + 1);
                if (!countryPeople.has(iso3)) countryPeople.set(iso3, []);
                countryPeople.get(iso3).push(person.name);
            }

            // Add to affiliations display using primary affiliation
            let primaryAffKey = "Independent";
            if (affiliations.length > 0) {
                const firstAff = affiliations[0];
                const entry = affMap.get(firstAff);
                primaryAffKey = entry?.short_name || firstAff;
            }
            addToAffMap(iso3, primaryAffKey);
        });
    });

    return { counts: countryCounts, people: countryPeople, affiliations: countryAffiliations };
}

// Render person name with optional ORCID/GitHub icons
function renderPersonWithIcons(person) {
    let html = `<span class="person-entry">${person.name}`;
    if (person.orcid) {
        const orcidUrl = person.orcid.startsWith("http") ? person.orcid : `https://orcid.org/${person.orcid}`;
        html += ` <a href="${orcidUrl}" target="_blank" rel="noopener" class="profile-icon" title="ORCID"><img src="${ORCID_ICON}" alt="ORCID"></a>`;
    }
    if (person.github) {
        html += ` <a href="https://github.com/${person.github}" target="_blank" rel="noopener" class="profile-icon" title="GitHub"><img src="${GITHUB_ICON}" alt="GitHub"></a>`;
    }
    html += `</span>`;
    return html;
}

// Map rendering
async function renderMap(countryData) {
    const width = 960;
    const height = 500;

    // Load world topology
    const worldUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
    const world = await d3.json(worldUrl);
    const countries = topojson.feature(world, world.objects.countries);

    // Equal Earth projection
    const projection = d3.geoEqualEarth()
        .fitSize([width, height], countries);

    const path = d3.geoPath(projection);

    // Color scale - teal/green gradient for better contrast
    const maxCount = Math.max(...countryData.counts.values(), 1);

    // Widest brand sweep: light mint floor → teal → mid blue → deep navy.
    // Most lively while staying perceptually monotonic.
    const omeSpectrum = d3.interpolateRgbBasis(
        ["#9ac7b7", "#76a78e", "#007860", "#1878c0", "#184878"]
    );
    const colorScale = d3.scaleSequentialSqrt()
        .domain([0, maxCount])
        .interpolator(t => omeSpectrum(0.1 + t * 0.85));
    // Create SVG with zoom support
    svg = d3.select(dom.map)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    // Create a group for zoomable content
    const g = svg.append("g");

    // Setup zoom behavior
    zoomBehavior = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        });

    svg.call(zoomBehavior);

    // Double-click to reset zoom
    svg.on("dblclick.zoom", () => {
        svg.transition().duration(500).call(zoomBehavior.transform, d3.zoomIdentity);
    });

    // Zoom button handlers
    dom.zoomIn.addEventListener("click", () => {
        svg.transition().duration(300).call(zoomBehavior.scaleBy, 1.5);
    });
    dom.zoomOut.addEventListener("click", () => {
        svg.transition().duration(300).call(zoomBehavior.scaleBy, 0.67);
    });
    dom.zoomReset.addEventListener("click", () => {
        svg.transition().duration(300).call(zoomBehavior.transform, d3.zoomIdentity);
    });

    // Draw countries in the zoomable group
    g.selectAll("path.country")
        .data(countries.features)
        .join("path")
        .attr("class", d => {
            const hasData = findCountryCode(d, countryData.counts);
            return `country ${hasData ? "" : "no-data"}`;
        })
        .attr("d", path)
        .attr("fill", d => {
            const code = findCountryCode(d, countryData.counts);
            if (!code) return "var(--land-color)";
            return colorScale(countryData.counts.get(code));
        })
        .on("mouseenter", (event, d) => showTooltip(event, d, countryData))
        .on("mousemove", (event) => moveTooltip(event))
        .on("mouseleave", hideTooltip)
        .on("click", (event, d) => handleCountryClick(event, d, countryData));

    // Render legend
    renderLegend(maxCount, colorScale);
}

// world-atlas uses numeric country IDs, map to ISO3
const NUMERIC_TO_ISO3 = {
    "004": "AFG", "008": "ALB", "012": "DZA", "024": "AGO", "032": "ARG",
    "036": "AUS", "040": "AUT", "056": "BEL", "076": "BRA", "100": "BGR",
    "124": "CAN", "152": "CHL", "156": "CHN", "170": "COL", "203": "CZE",
    "208": "DNK", "818": "EGY", "246": "FIN", "250": "FRA", "276": "DEU",
    "300": "GRC", "348": "HUN", "356": "IND", "360": "IDN", "372": "IRL",
    "376": "ISR", "380": "ITA", "392": "JPN", "404": "KEN", "410": "KOR",
    "458": "MYS", "484": "MEX", "528": "NLD", "554": "NZL", "566": "NGA",
    "578": "NOR", "586": "PAK", "608": "PHL", "616": "POL", "620": "PRT",
    "642": "ROU", "643": "RUS", "682": "SAU", "702": "SGP", "710": "ZAF",
    "724": "ESP", "752": "SWE", "756": "CHE", "764": "THA", "792": "TUR",
    "804": "UKR", "826": "GBR", "840": "USA", "862": "VEN", "704": "VNM"
};

function findCountryCode(feature, counts) {
    const numericId = String(feature.id).padStart(3, "0");
    const iso3 = NUMERIC_TO_ISO3[numericId];
    if (iso3 && counts.has(iso3)) return iso3;

    for (const code of counts.keys()) {
        if (COUNTRY_NAMES[code] && feature.properties?.name?.includes(COUNTRY_NAMES[code])) {
            return code;
        }
    }
    return null;
}

function getCountryName(feature) {
    const numericId = String(feature.id).padStart(3, "0");
    const iso3 = NUMERIC_TO_ISO3[numericId];
    return COUNTRY_NAMES[iso3] || feature.properties?.name || "Unknown";
}

function showTooltip(event, feature, countryData) {
    const code = findCountryCode(feature, countryData.counts);
    const name = getCountryName(feature);
    const count = code ? countryData.counts.get(code) : 0;
    const affiliations = code ? countryData.affiliations.get(code) : null;

    let html = `<div class="tooltip-title">${name}</div>`;
    if (count > 0) {
        html += `<div class="tooltip-count">${count} contributor${count !== 1 ? "s" : ""}</div>`;
        if (affiliations && affiliations.size > 0) {
            html += `<div class="tooltip-affiliations">`;
            for (const [affName, people] of affiliations) {
                html += `<div class="tooltip-aff">`;
                html += `<span class="tooltip-aff-name">${affName}</span>`;
                html += `<span class="tooltip-aff-people">${people.map(p => p.name).join(", ")}</span>`;
                html += `</div>`;
            }
            html += `</div>`;
        }
    } else {
        html += `<div class="tooltip-count">No contributors</div>`;
    }

    dom.tooltip.innerHTML = html;
    dom.tooltip.classList.add("visible");
    moveTooltip(event);
}

function moveTooltip(event) {
    const x = event.clientX + 15;
    const y = event.clientY + 15;

    // Keep tooltip in viewport
    const rect = dom.tooltip.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width - 20;
    const maxY = window.innerHeight - rect.height - 20;

    dom.tooltip.style.left = `${Math.min(x, maxX)}px`;
    dom.tooltip.style.top = `${Math.min(y, maxY)}px`;
}

function hideTooltip() {
    dom.tooltip.classList.remove("visible");
}

function handleCountryClick(event, feature, countryData) {
    const code = findCountryCode(feature, countryData.counts);
    if (!code) return;

    const name = getCountryName(feature);
    const count = countryData.counts.get(code);
    const affiliations = countryData.affiliations.get(code);

    // Update selected state
    d3.selectAll(".country").classed("selected", false);
    d3.select(event.target).classed("selected", true);
    selectedCountry = code;

    // Populate detail panel
    dom.detailTitle.textContent = name;
    dom.detailCount.textContent = `${count} contributor${count !== 1 ? "s" : ""}`;

    let content = "";
    if (affiliations && affiliations.size > 0) {
        const sortedAffs = Array.from(affiliations.entries()).sort((a, b) => b[1].length - a[1].length);
        for (const [affName, people] of sortedAffs) {
            content += `<div class="detail-aff">`;
            content += `<div class="detail-aff-name">${affName}</div>`;
            content += `<div class="detail-aff-people">${people.map(renderPersonWithIcons).join(", ")}</div>`;
            content += `</div>`;
        }
    }
    dom.detailContent.innerHTML = content;

    // Show panel
    dom.detailOverlay.classList.add("visible");
    dom.detailPanel.classList.add("visible");
}

function closeDetailPanel() {
    dom.detailOverlay.classList.remove("visible");
    dom.detailPanel.classList.remove("visible");
    d3.selectAll(".country").classed("selected", false);
    selectedCountry = null;
}

function renderLegend(maxCount, colorScale) {
    const steps = 5;
    const colors = d3.range(steps).map(i => colorScale(i * maxCount / (steps - 1)));

    let html = `<div class="legend-scale">`;
    html += `<span>0</span><div class="legend-bar">`;
    colors.forEach(c => {
        html += `<span style="background:${c}"></span>`;
    });
    html += `</div><span>${maxCount}</span><span style="margin-left:0.5rem">contributors</span>`;
    html += `</div>`;
    html += `<div class="legend-info">`;
    html += `Scroll or pinch to zoom · Double-click to reset · `;
    html += `<a href="https://en.wikipedia.org/wiki/Equal_Earth_projection" target="_blank" rel="noopener">Equal Earth projection</a>. `;
    html += `Contributors are mapped by their affiliations and their remote work locations.`;
    html += `</div>`;
    dom.legend.innerHTML = html;
}

// Event listeners
dom.detailClose.addEventListener("click", closeDetailPanel);
dom.detailOverlay.addEventListener("click", closeDetailPanel);
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDetailPanel();
});

// Main
async function init() {
    try {
        const [peopleData, affData] = await Promise.all([
            fetchYaml("../people.yaml"),
            fetchYaml("../affiliation_shortener.yaml")
        ]);

        const people = peopleData.people || [];
        const affiliations = affData.affiliations || [];
        const affMap = new Map(affiliations.map(a => [a.full_name, a]));

        const countryData = aggregateByCountry(people, affMap);
        await renderMap(countryData);

        console.info("✅ Map loaded:", countryData.counts.size, "countries with contributors");
    } catch (err) {
        console.error(err);
        dom.error.textContent = err.message;
    }
}

initThemeToggle();
init();
