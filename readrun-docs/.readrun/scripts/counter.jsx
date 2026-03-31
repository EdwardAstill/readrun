function Counter() {
  const [count, setCount] = React.useState(0);
  const btn = "px-4 py-2 rounded-lg font-medium text-white transition-colors";
  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <span className="text-6xl font-light tabular-nums tracking-tight" style={{ fontFamily: "system-ui, sans-serif" }}>
        {count}
      </span>
      <div className="flex gap-2">
        <button className={`${btn} bg-gray-400 hover:bg-gray-500`} onClick={() => setCount(count - 1)}>−</button>
        <button className={`${btn} bg-gray-200 hover:bg-gray-300 text-gray-700`} onClick={() => setCount(0)}>Reset</button>
        <button className={`${btn} bg-blue-500 hover:bg-blue-600`} onClick={() => setCount(count + 1)}>+</button>
      </div>
    </div>
  );
}

render(<Counter />);
