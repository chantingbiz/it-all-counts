const StatusRemark = () => {
  const productiveHours = 5; // placeholder
  const goalHours = 8;

  const remark =
    productiveHours >= goalHours
      ? "✅ You’re on fire today!"
      : "🚀 Let’s push a little more.";

  return (
    <div className="text-center text-lg font-medium text-gray-700">
      {remark}
    </div>
  );
};

export default StatusRemark;
