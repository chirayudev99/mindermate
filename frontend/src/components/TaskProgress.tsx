import React from "react";

interface CircleProgressProps {
  total: number;
  completed: number;
}

const CircleProgress: React.FC<CircleProgressProps> = ({ total, completed }) => {
  const remaining = total - completed;
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      {/* Outer progress circle */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 0deg, #fff ${percentage * 3.6}deg, #ffffff40 ${percentage * 3.6}deg)`,
        }}
      ></div>

      {/* Inner white circle */}
      <div className="absolute inset-[5px] bg-white rounded-full flex flex-col items-center justify-center text-[#7c3aed]">
        <p className="text-lg font-semibold">{remaining}</p>
        <span className="text-[10px] font-medium tracking-wide">LEFT</span>
      </div>
    </div>
  );
};

export default CircleProgress;
