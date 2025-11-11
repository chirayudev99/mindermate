import React, { useState } from "react";

const TabSwitcher: React.FC = ({selectedTab,onSelectTab}) => {

  return (
    <div className="flex gap-4 items-center justify-end mt-10 p-2">
      {["prior", "simple"].map((tab) => (
        <button
          key={tab}
          onClick={() => onSelectTab(tab as "prior" | "simple")}
          className={`text-lg font-semibold px-4 py-1.5 rounded-xl transition-all duration-200 
            ${
                selectedTab === tab
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/30"
                : "text-gray-400 hover:text-white"
            }`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default TabSwitcher;
