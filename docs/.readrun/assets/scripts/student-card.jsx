function StudentCard() {
  const student = { name: "Bob", grade: 85, subjects: ["Maths", "Physics"] };
  const gradeColor =
    student.grade >= 90 ? "text-green-600" :
    student.grade >= 70 ? "text-blue-600" : "text-red-600";

  return (
    <div className="border border-gray-200 rounded-xl p-5 max-w-xs shadow-sm">
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">student</p>
      <h3 className="text-xl font-bold text-gray-800">{student.name}</h3>
      <p className={`text-4xl font-mono font-bold mt-2 ${gradeColor}`}>
        {student.grade}<span className="text-lg text-gray-400">%</span>
      </p>
      <div className="flex gap-2 mt-3">
        {student.subjects.map(s => (
          <span key={s} className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-100">
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

render(<StudentCard />);
