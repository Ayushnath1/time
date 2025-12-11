const searchInput = document.getElementById("search");
const container = document.getElementById("timeContainer");

// Get all supported timezones
let zones = [];
try {
  zones = Intl.supportedValuesOf("timeZone");
} catch {
  zones = ["UTC", "Asia/Kolkata", "America/New_York", "Europe/London"];
}

// Render all cards
function renderZones(filter = "") {
  container.innerHTML = "";

  zones
    .filter(z => z.toLowerCase().includes(filter.toLowerCase()))
    .forEach(zone => {
      const card = document.createElement("div");
      card.className = "card";

      const title = document.createElement("div");
      title.className = "title";
      title.textContent = zone.replace("_", " ");

      const time = document.createElement("div");
      time.className = "time";
      time.textContent = getTime(zone);

      card.appendChild(title);
      card.appendChild(time);
      container.appendChild(card);

      card.dataset.zone = zone;
      card.dataset.timeElement = time;
    });
}

// Get live time for zone
function getTime(zone) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: zone
    }).format(new Date());
  } catch {
    return "N/A";
  }
}

// Update times every second
setInterval(() => {
  document.querySelectorAll(".card").forEach(card => {
    const zone = card.dataset.zone;
    const timeElement = card.querySelector(".time");
    timeElement.textContent = getTime(zone);
  });
}, 1000);

// Search filter
searchInput.addEventListener("input", e => {
  renderZones(e.target.value);
});

// Initial load
renderZones();

