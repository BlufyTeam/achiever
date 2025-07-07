import React from "react";

interface CardViewProps {
  children?: React.ReactNode;
}

const CardView: React.FC<CardViewProps> = ({ children }) => {
  return (
    <div className="max-w-sm rounded-lg bg-white p-10 shadow-lg">
      <div className="px-6 py-4">{children}</div>
    </div>
  );
};

export default CardView;
