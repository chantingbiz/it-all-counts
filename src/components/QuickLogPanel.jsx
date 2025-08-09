const quickButtons = [
  { label: "Wake", color: "gray" },
  { label: "Meal", color: "green" },
  { label: "Exercise", color: "green" },
  { label: "Social", color: "green" },
  { label: "Day Job", color: "yellow" },
  { label: "Sleep", color: "gray" },
];

const QuickLogPanel = () => (
  <div className="mt-4 flex flex-wrap gap-2 justify-center">
    {quickButtons.map((btn) => (
      <button
        key={btn.label}
        className={`px-4 py-2 rounded text-white font-medium ${
          btn.color === "green"
            ? "bg-green-600"
            : btn.color === "yellow"
            ? "bg-yellow-500"
            : "bg-gray-500"
        }`}
        onClick={() => alert(`Logging: ${btn.label}`)}
      >
        {btn.label}
      </button>
    ))}
  </div>
);

export default QuickLogPanel;
