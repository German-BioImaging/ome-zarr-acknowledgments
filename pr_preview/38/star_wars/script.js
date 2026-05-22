const CONFIG = {
    crawlSpeed: 40, // pixels per second
    audioUrl: "https://starwarsintrogenerator.com/media/star-wars-main-title.mp3"
};

const dom = {
    body: document.body,
    paperPeople: document.getElementById("paper-people"),
    others: document.getElementById("others"),
    status: document.getElementById("status"),
    audio: document.getElementById("theme-audio"),
    startScreen: document.getElementById("start-screen"),
    crawlContent: document.querySelector(".crawl-content"),
    root: document.documentElement,
    endContributors: document.getElementById("end-contributors"),
    endOthers: document.getElementById("end-others"),
    endOthersSection: document.getElementById("end-others-section")
};

// Store data globally for end screen
let contributorData = { blocks: [], others: [] };

// --- Data Fetching & Processing ---

async function fetchYaml(path) {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Failed to load ${path}`);
    const text = await response.text();
    return jsyaml.load(text) || {};
}

function getAffEntry(affMap, fullName) {
    return affMap.get(fullName) || { full_name: fullName, short_name: fullName, country_code: "--" };
}

function buildBlocks(people, affMap) {
    const blocksMap = new Map();

    people.forEach(person => {
        const affiliations = person.affiliations || [];
        if (affiliations.length === 0) {
            // Handle people with no affiliations if needed
        }

        affiliations.forEach(fullAff => {
            const entry = getAffEntry(affMap, fullAff);
            const key = `${entry.country_code}|${entry.short_name}`;

            if (!blocksMap.has(key)) {
                blocksMap.set(key, {
                    country: entry.country_code || "--",
                    affShort: entry.short_name || fullAff,
                    fullName: fullAff,
                    people: []
                });
            }

            const block = blocksMap.get(key);
            if (!block.people.includes(person.name)) {
                block.people.push(person.name);
            }
        });
    });

    return Array.from(blocksMap.values());
}

function groupByCountry(blocks) {
    const groups = new Map();
    blocks.forEach(block => {
        if (!groups.has(block.country)) groups.set(block.country, []);
        groups.get(block.country).push(block);
    });
    return groups;
}

// --- Rendering ---

function renderPeople(blocks) {
    const countryGroups = groupByCountry(blocks);
    const sortedCountries = Array.from(countryGroups.keys()).sort();

    const fragment = document.createDocumentFragment();

    sortedCountries.forEach(country => {
        const groupDiv = document.createElement("div");
        groupDiv.className = "country-group";

        const countryHeader = document.createElement("span");
        countryHeader.className = "country-name";
        countryHeader.textContent = country;
        groupDiv.appendChild(countryHeader);

        const countryBlocks = countryGroups.get(country).sort((a, b) => a.affShort.localeCompare(b.affShort));

        countryBlocks.forEach((block, index) => {
            const affSpan = document.createElement("span");
            affSpan.className = "affiliation-name";
            affSpan.textContent = block.affShort;
            // Optional: Add color coding if desired, but keeping it clean for now
            // affSpan.style.color = ...

            const peopleSpan = document.createElement("span");
            peopleSpan.className = "people-list";
            peopleSpan.textContent = `: ${block.people.join(", ")}`;

            const wrapper = document.createElement("div");
            wrapper.appendChild(affSpan);
            wrapper.appendChild(peopleSpan);
            groupDiv.appendChild(wrapper);
        });

        fragment.appendChild(groupDiv);
    });

    dom.paperPeople.appendChild(fragment);
}

function renderOthers(people) {
    if (!people.length) return;
    const text = people.map(p => p.name).join(", ");
    dom.others.textContent = text;
}

// --- End Screen Rendering ---

function getRainbowColor(index, total) {
    const denom = Math.max(1, total - 1);
    const hue = Math.round((index / denom) * 300);
    return `hsl(${hue}, 85%, 65%)`;
}

function renderEndScreen() {
    const { blocks, others } = contributorData;
    const countryGroups = groupByCountry(blocks);
    const sortedCountries = Array.from(countryGroups.keys()).sort();

    const fragment = document.createDocumentFragment();
    let affIndex = 0;
    const totalBlocks = blocks.length;

    sortedCountries.forEach((country, ci) => {
        const countryBlocks = countryGroups.get(country).sort((a, b) => a.affShort.localeCompare(b.affShort));

        if (ci > 0) {
            const sep = document.createElement("span");
            sep.className = "end-sep";
            sep.textContent = "//";
            fragment.appendChild(sep);
            fragment.appendChild(document.createTextNode(" "));
        }

        const groupDiv = document.createElement("span");
        groupDiv.className = "end-country-group";

        const countrySpan = document.createElement("span");
        countrySpan.className = "end-country";
        countrySpan.textContent = country;
        groupDiv.appendChild(countrySpan);
        groupDiv.appendChild(document.createTextNode(" "));

        countryBlocks.forEach(block => {
            const affSpan = document.createElement("span");
            affSpan.className = "end-aff";
            affSpan.textContent = block.affShort;
            affSpan.style.color = getRainbowColor(affIndex, totalBlocks);
            affIndex++;
            groupDiv.appendChild(affSpan);

            const peopleSpan = document.createElement("span");
            peopleSpan.className = "end-people-list";
            peopleSpan.textContent = ` ${block.people.join(", ")}`;
            groupDiv.appendChild(peopleSpan);
            groupDiv.appendChild(document.createTextNode(" "));
        });

        fragment.appendChild(groupDiv);
        fragment.appendChild(document.createTextNode(" "));
    });

    dom.endContributors.appendChild(fragment);

    // Render others
    if (others.length > 0) {
        const othersFragment = document.createDocumentFragment();
        others.forEach((person, idx) => {
            const nameSpan = document.createElement("span");
            nameSpan.textContent = person.name;
            othersFragment.appendChild(nameSpan);
            if (idx < others.length - 1) {
                othersFragment.appendChild(document.createTextNode(" "));
            }
        });
        dom.endOthers.appendChild(othersFragment);
    } else {
        dom.endOthersSection.style.display = "none";
    }
}

// --- Animation & Audio ---

function updateCrawlDuration() {
    const height = dom.crawlContent.scrollHeight;
    const viewHeight = window.innerHeight;
    // Calculate duration: time = distance / speed
    // Distance = height of content + height of screen (to scroll fully off)
    const distance = height + viewHeight;
    const duration = distance / CONFIG.crawlSpeed;

    dom.root.style.setProperty("--crawl-duration", `${duration}s`);
    // Update the end position to ensure it scrolls completely off screen
    // We use -100% - height in CSS usually, but here we can set a variable
}

async function init() {
    try {
        const [peopleData, affData] = await Promise.all([
            fetchYaml("../people.yaml"),
            fetchYaml("../affiliation_shortener.yaml")
        ]);

        const people = peopleData.people || [];
        const affiliations = affData.affiliations || [];

        const affMap = new Map(affiliations.map(a => [a.full_name, a]));

        const paperPeople = people.filter(p => p.affiliations && p.affiliations.length > 0);
        const others = people.filter(p => !p.affiliations || p.affiliations.length === 0);

        const blocks = buildBlocks(paperPeople, affMap);
        renderPeople(blocks);
        renderOthers(others);

        // Store for end screen
        contributorData = { blocks, others };
        renderEndScreen();

        // Wait for render then calculate duration
        requestAnimationFrame(updateCrawlDuration);

    } catch (err) {
        console.error(err);
        dom.status.textContent = "Error loading data.";
        dom.status.classList.add("error-msg");
    }
}

function startExperience(withAudio) {
    dom.startScreen.style.display = "none";
    dom.body.classList.remove("ended");
    dom.body.classList.add("playing");

    if (withAudio) {
        dom.audio.volume = 0.5;
        dom.audio.play().catch(e => {
            console.warn("Audio play failed", e);
            dom.status.textContent = "Audio blocked. Click to enable.";
        });
    }

    // Show end screen when crawl completes
    const crawlDuration = parseFloat(getComputedStyle(dom.root).getPropertyValue("--crawl-duration")) || 160;
    const crawlDelay = parseFloat(getComputedStyle(dom.root).getPropertyValue("--crawl-delay")) || 12;

    setTimeout(() => {
        dom.body.classList.add("ended");
        dom.body.classList.remove("playing");
    }, (crawlDuration + crawlDelay) * 1000);
}

function restartExperience() {
    // Reset everything
    dom.body.classList.remove("playing", "ended");
    dom.audio.pause();
    dom.audio.currentTime = 0;
    dom.startScreen.style.display = "flex";

    // Force reflow to restart animations
    void dom.body.offsetWidth;
}

function skipToEnd() {
    // Stop audio and animations, go straight to end screen
    dom.body.classList.remove("playing");
    dom.body.classList.add("ended");
    dom.audio.pause();
}

// --- Event Listeners ---

document.getElementById("btn-start").addEventListener("click", () => startExperience(true));
document.getElementById("btn-silent").addEventListener("click", () => startExperience(false));
document.getElementById("btn-restart").addEventListener("click", restartExperience);

document.getElementById("btn-skip").addEventListener("click", skipToEnd);

window.addEventListener("resize", () => {
    requestAnimationFrame(updateCrawlDuration);
});

init();
