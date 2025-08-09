const TodoList = () => {
  const tasks = [
    { id: 1, label: "Gym", color: "green" },
    { id: 2, label: "Call Mom", color: "green" },
  ];

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-2">Today's Tasks</h2>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center justify-between bg-white shadow p-3 rounded"
          >
            <span className={`font-medium ${task.color === "green" ? "text-green-700" : "text-red-600"}`}>
              {task.label}
            </span>
            <button
              className="text-sm bg-green-500 text-white px-3 py-1 rounded"
              onClick={() => alert(`Completed: ${task.label}`)}
            >
              Complete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;
