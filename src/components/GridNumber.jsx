// A component for selecting the number of rows and columns in the grid, as well as the aspect ratio (1:1, 4:6, 6:4)
import React, { useState } from "react";

function GridNumber({numRow, setNumRow, aspectRatio, setAspectRatio}) {

  const options = [
    { value: "1 / 1", label: "1 × 1" },
    { value: "4 / 6", label: "4 × 6" },
    { value: "6 / 4", label: "6 × 4" },
  ];

  const numCol = (numRow, aspectRatio) => {
    if (aspectRatio === "1 / 1") {
      return numRow;
    } else if (aspectRatio === "4 / 6") {
      return numRow / 6 * 4;
    } else if (aspectRatio === "6 / 4") {
      return numRow / 4 * 6;
    }
  }

  return (
    <div>
      <span>Column</span>
      <input type="text" value={ Math.round(numCol(numRow, aspectRatio.value))} readOnly />
        <label>
        <span>Row</span>
        <input
          type="number"
          value={numRow}
          min={16}
          max={32}
          onChange={(e) => setNumRow(Number(e.target.value))}
        />
      </label>

      <span>Ratio</span>
      <select value={aspectRatio.value} onChange={(e) => setAspectRatio({ value: e.target.value, label: e.target.label })}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default GridNumber;
