export default function RoleSwitcher({ role, onChange }) {
  const base = "px-4 py-1.5 text-sm font-medium rounded-md transition";
  const on = "bg-white text-gray-900 shadow-sm";
  const off = "text-gray-500 hover:text-gray-700";

  return (
    <div className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button type="button" onClick={() => onChange("rider")} className={`${base} ${role === "rider" ? on : off}`}>
        Rider
      </button>
      <button type="button" onClick={() => onChange("driver")} className={`${base} ${role === "driver" ? on : off}`}>
        Driver
      </button>
    </div>
  );
}
