import React, { useState } from "react";
import {
  FaAngleLeft,
  FaAngleRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaCalendarAlt,
} from "react-icons/fa";

const HorizontalCalendar: React.FC<{
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}> = ({ selectedDate, onSelectDate }) => {
  const today = new Date();

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getWeekDays = (date: Date) => {
    const start = getStartOfWeek(date);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

    const weekDays = getWeekDays(selectedDate);

  const changeWeek = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + offset * 7);
    onSelectDate(newDate);
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(selectedDate.getMonth() + offset);
    onSelectDate(newDate);
  };

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  return (
    <div className="flex flex-col items-center bg-black/40 rounded-2xl p-4 text-white w-full max-w-5xl shadow-lg">
      {/* Month + Year */}
      <div className="flex items-center justify-between w-full mb-4">
        <h2 className="text-lg font-semibold">
          {selectedDate.toLocaleString("default", {
            month: "long",
          })}{" "}
          {selectedDate.getFullYear()}
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <FaAngleDoubleLeft />
          </button>
          <button
            onClick={() => changeWeek(-1)}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <FaAngleLeft />
          </button>

          <button
            onClick={() => changeWeek(1)}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <FaAngleRight />
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <FaAngleDoubleRight />
          </button>

          <button className="ml-2 p-2 bg-violet-600 hover:bg-violet-700 rounded-lg">
            <FaCalendarAlt />
          </button>
        </div>
      </div>

      {/* Days Bar */}
      <div className="flex justify-between items-center w-full gap-6 overflow-x-auto scrollbar-hide">
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, selectedDate);

          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`flex flex-col items-center justify-center w-full py-3 rounded-xl cursor-pointer transition-all
                ${
                  isSelected
                    ? "bg-violet-600 text-white"
                    : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
            >
              <span className="text-xs uppercase">
                {day.toLocaleString("default", { weekday: "short" })}
              </span>
              <span
                className={`text-lg font-semibold ${
                  isToday && !isSelected ? "text-violet-400" : ""
                }`}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HorizontalCalendar;
