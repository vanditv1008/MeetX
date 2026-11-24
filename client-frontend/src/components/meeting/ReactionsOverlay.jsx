import React from "react";

const ReactionsOverlay = ({ reactions = [] }) => {
  if (!reactions || reactions.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
      {reactions.map((r, index) => {
        // Pseudo-random horizontal spread based on reaction ID or timestamp
        const leftPercent = 20 + ((r.timestamp || index * 37) % 60);

        return (
          <div
            key={r.id || index}
            style={{ left: `${leftPercent}%` }}
            className="absolute bottom-16 flex flex-col items-center animate-reaction-float"
          >
            <span className="text-4xl filter drop-shadow-md select-none transform hover:scale-125 transition-transform">
              {r.emoji}
            </span>
            {r.userName && (
              <span className="text-[10px] font-semibold bg-slate-900/70 text-white px-2 py-0.5 rounded-full mt-1 backdrop-blur-xs shadow-xs truncate max-w-28">
                {r.userName}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ReactionsOverlay;
