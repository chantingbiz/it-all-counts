import React from "react";

const TestLayout = () => {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-black">
      <div className="relative w-[80vw] max-w-[400px] aspect-square bg-blue-500">
        <div className="absolute inset-0 bg-green-500 opacity-50 z-10" />
        <div className="absolute inset-0 bg-red-500 opacity-50 z-20" />
      </div>
    </div>
  );
};

export default TestLayout;
