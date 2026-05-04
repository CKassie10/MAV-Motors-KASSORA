import {
  filterVehiclesByStatus,
  getAllVehicles,
  getVehiclesByCategory,
  loadInventoryData,
  searchVehicles
} from "./inventory.js";

const state = {
  category: "all",
  status: "all",
  sort: "",
  searchTerm: "",
  page: 1,
  itemsPerPage: 6
};

const inventoryGrid = document.getElementById("inventoryGrid");
const emptyState = document.getElementById("emptyState");
const filterTabs = document.getElementById("filterTabs");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const statusSelect = document.getElementById("statusSelect");
const pagination = document.getElementById("pagination");

const statusClassMap = {
  Available: "status-available",
  Reserved: "status-reserved",
  Sold: "status-sold"
};

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);

function formatPrice(value) {
  return `R ${value.toLocaleString("en-ZA")}`;
}

function formatMileage(value) {
  return `${value.toLocaleString("en-ZA")} km`;
}

function sortVehicles(vehicles, sortKey) {
  const sortedVehicles = [...vehicles];

  if (sortKey === "price-low") {
    sortedVehicles.sort((a, b) => a.price - b.price);
  } else if (sortKey === "price-high") {
    sortedVehicles.sort((a, b) => b.price - a.price);
  } else if (sortKey === "mileage-low") {
    sortedVehicles.sort((a, b) => a.mileage - b.mileage);
  } else if (sortKey === "newest") {
    sortedVehicles.sort((a, b) => b.year - a.year);
  }

  return sortedVehicles;
}

function renderPagination(totalItems) {
  pagination.innerHTML = "";

  const totalPages = Math.ceil(totalItems / state.itemsPerPage);
  if (totalPages <= 1) {
    return;
  }

  for (let page = 1; page <= totalPages; page += 1) {
    const button = document.createElement("button");
    button.className = `pagination-btn${page === state.page ? " active" : ""}`;
    button.textContent = String(page);

    button.addEventListener("click", () => {
      state.page = page;
      renderInventory();
      window.scrollTo({ top: inventoryGrid.offsetTop - 120, behavior: "smooth" });
    });

    pagination.appendChild(button);
  }
}

function renderCars(vehicles) {
  inventoryGrid.innerHTML = "";

  if (!vehicles.length) {
    emptyState.style.display = "block";
    pagination.innerHTML = "";
    return;
  }

  emptyState.style.display = "none";

  const startIndex = (state.page - 1) * state.itemsPerPage;
  const paginatedVehicles = vehicles.slice(startIndex, startIndex + state.itemsPerPage);

  paginatedVehicles.forEach((vehicle, index) => {
    const card = document.createElement("article");
    card.className = `car-card reveal${index > 0 ? ` reveal-delay-${Math.min(index, 5)}` : ""}`;

    const statusClass = statusClassMap[vehicle.status] || "status-available";

    card.innerHTML = `
      <div class="car-status ${statusClass}">${vehicle.status}</div>
      <div class="car-img-wrap">
        <img src="${vehicle.imageUrl}" alt="${vehicle.year} ${vehicle.make} ${vehicle.model}" loading="lazy">
      </div>
      <div class="car-body">
        <div class="car-top">
          <div>
            <div class="car-make">${vehicle.make}</div>
            <div class="car-model"><span class="chrome-text">${vehicle.model}</span></div>
          </div>
          <div class="car-id">${vehicle.id}</div>
        </div>
        <div class="car-category">${vehicle.category}</div>
        <div class="car-specs">
          <span class="car-spec">${vehicle.year}</span>
          <span class="car-spec">${formatMileage(vehicle.mileage)}</span>
          <span class="car-spec">${vehicle.transmission}</span>
          <span class="car-spec">${vehicle.fuelType}</span>
        </div>
        <div class="car-meta">
          <span>${vehicle.color}</span>
        </div>
        <div class="car-footer">
          <div>
            <div class="car-price">${formatPrice(vehicle.price)}</div>
            <div class="car-price-sub">${vehicle.status} now</div>
          </div>
          <a href="contact.html" class="btn btn-ghost car-btn">Enquire</a>
        </div>
      </div>
    `;

    inventoryGrid.appendChild(card);
    revealObserver.observe(card);
  });

  renderPagination(vehicles.length);
}

function renderError(message) {
  inventoryGrid.innerHTML = "";
  pagination.innerHTML = "";
  emptyState.style.display = "block";
  emptyState.innerHTML = `<p>${message}</p>`;
}

async function buildCategoryTabs() {
  const inventoryData = await loadInventoryData();

  filterTabs.innerHTML = `
    <button class="filter-tab active" data-filter="all">All Vehicles</button>
    ${inventoryData.categories
      .map((category) => `<button class="filter-tab" data-filter="${category.name}">${category.name}</button>`)
      .join("")}
  `;

  filterTabs.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      filterTabs.querySelectorAll(".filter-tab").forEach((button) => button.classList.remove("active"));
      tab.classList.add("active");
      state.category = tab.dataset.filter || "all";
      state.page = 1;
      renderInventory();
    });
  });
}

async function renderInventory() {
  let vehicles = await getAllVehicles();

  vehicles = await getVehiclesByCategory(state.category, vehicles);
  vehicles = await filterVehiclesByStatus(state.status, vehicles);
  vehicles = await searchVehicles(state.searchTerm, vehicles);
  vehicles = sortVehicles(vehicles, state.sort);

  const totalPages = Math.max(1, Math.ceil(vehicles.length / state.itemsPerPage));
  if (state.page > totalPages) {
    state.page = 1;
  }

  renderCars(vehicles);
}

async function initInventoryPage() {
  try {
    await buildCategoryTabs();

    searchInput.addEventListener("input", (event) => {
      state.searchTerm = event.target.value;
      state.page = 1;
      renderInventory();
    });

    sortSelect.addEventListener("change", (event) => {
      state.sort = event.target.value;
      state.page = 1;
      renderInventory();
    });

    statusSelect.addEventListener("change", (event) => {
      state.status = event.target.value;
      state.page = 1;
      renderInventory();
    });

    await renderInventory();
  } catch (error) {
    renderError("Unable to load inventory data. Serve the site through a local web server to fetch inventory.json.");
    console.error(error);
  }
}

initInventoryPage();
