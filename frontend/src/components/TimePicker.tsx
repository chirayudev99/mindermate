import React, { useState } from "react";

interface CustomTimePickerProps {
  value?: string;
  onChange: (time: string) => void;
}

const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value = "09:00",
  onChange,
}) => {
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  const [selectedHour, setSelectedHour] = useState(value.split(":")[0]);
  const [selectedMinute, setSelectedMinute] = useState(value.split(":")[1]);

  const handleSelect = (hour: string, minute: string) => {
    onChange(`${hour}:${minute}`);
  };

  const ItemList: React.FC<{
    items: string[];
    selected: string;
    setSelected: React.Dispatch<React.SetStateAction<string>>;
    type: "hour" | "minute";
  }> = ({ items, selected, setSelected, type }) => (
    <div
      className="relative h-[150px] w-[70px] overflow-y-scroll scrollbar-hide flex flex-col items-center"
    >
      {/* Highlight band for center alignment (visual only) */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-full h-[40px] border-y border-violet-600/40 bg-violet-600/5 rounded-md pointer-events-none"></div>

      <div className="flex flex-col items-center py-[50px] space-y-[10px]">
        {items.map((item) => (
          <div
            key={item}
            onClick={() => {
              setSelected(item);
              if (type === "hour") {
                handleSelect(item, selectedMinute);
              } else {
                handleSelect(selectedHour, item);
              }
            }}
            className={`h-[40px] flex items-center justify-center w-[45px] text-base font-medium rounded-md cursor-pointer transition-all duration-200 select-none
              ${
                selected === item
                  ? "bg-violet-600 text-white scale-105 shadow-md"
                  : "text-gray-400 hover:text-violet-400"
              }`}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-center gap-6 bg-gray-900 p-4 rounded-2xl border border-gray-700 shadow-lg">
      <ItemList
        items={hours}
        selected={selectedHour}
        setSelected={setSelectedHour}
        type="hour"
      />
      <span className="text-gray-500 text-xl font-semibold">:</span>
      <ItemList
        items={minutes}
        selected={selectedMinute}
        setSelected={setSelectedMinute}
        type="minute"
      />
    </div>
  );
};

export default CustomTimePicker;
