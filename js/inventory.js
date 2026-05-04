const INVENTORY_URL = new URL("../inventory.json", import.meta.url);

let inventoryCachePromise;

function cloneVehicles(vehicles) {
  return vehicles.map((vehicle) => ({ ...vehicle }));
}

function flattenVehicles(data) {
  return data.categories.flatMap((category) => category.vehicles);
}

function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
}

async function getVehicleSource(vehicles) {
  if (Array.isArray(vehicles)) {
    return cloneVehicles(vehicles);
  }

  const data = await loadInventoryData();
  return cloneVehicles(flattenVehicles(data));
}

export async function loadInventoryData() {
  if (!inventoryCachePromise) {
    inventoryCachePromise = fetch(INVENTORY_URL).then((response) => {
      if (!response.ok) {
        throw new Error(`Unable to load inventory data: ${response.status}`);
      }

      return response.json();
    });
  }

  return inventoryCachePromise;
}

export async function getAllVehicles() {
  return getVehicleSource();
}

export async function getVehiclesByCategory(category, vehicles) {
  const source = await getVehicleSource(vehicles);

  if (!category || normalizeValue(category) === "all") {
    return source;
  }

  const normalizedCategory = normalizeValue(category);
  return source.filter((vehicle) => normalizeValue(vehicle.category) === normalizedCategory);
}

export async function filterVehiclesByStatus(status, vehicles) {
  const source = await getVehicleSource(vehicles);

  if (!status || normalizeValue(status) === "all") {
    return source;
  }

  const normalizedStatus = normalizeValue(status);
  return source.filter((vehicle) => normalizeValue(vehicle.status) === normalizedStatus);
}

export async function searchVehicles(query, vehicles) {
  const source = await getVehicleSource(vehicles);
  const normalizedQuery = normalizeValue(query);

  if (!normalizedQuery) {
    return source;
  }

  return source.filter((vehicle) => {
    return (
      normalizeValue(vehicle.make).includes(normalizedQuery) ||
      normalizeValue(vehicle.model).includes(normalizedQuery)
    );
  });
}
