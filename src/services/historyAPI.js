const BASE = import.meta.env.VITE_HISTORY_API;

export async function saveRideRecord(record) {
  const res = await fetch(`${BASE}/rides`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error(`History save failed: ${res.status}`);
  return res.json();
}

export async function fetchRideHistory() {
  const res = await fetch(`${BASE}/rides`);
  if (!res.ok) throw new Error(`History fetch failed: ${res.status}`);
  return res.json();
}