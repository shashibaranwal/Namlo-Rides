export default function RoleSwitcher({ role, onChange }) {
  const base = "px-4 py-1.5 text-sm font-medium rounded-md transition";
  const on = "bg-wine-600 text-white shadow-sm";
  const off = "text-wine-700 hover:text-wine-900";

  return (
    <div className="inline-flex items-center gap-1 bg-cream-200 rounded-lg p-1">
      <button type="button" onClick={() => onChange("rider")} className={`${base} ${role === "rider" ? on : off}`}>
        Rider
      </button>
      <button type="button" onClick={() => onChange("driver")} className={`${base} ${role === "driver" ? on : off}`}>
        Driver
      </button>
    </div>
  );
}
