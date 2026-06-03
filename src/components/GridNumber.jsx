// A component for selecting the number of rows and columns in the grid, as well as the aspect ratio (1:1, 4:6, 6:4)
import { set } from "immutable";
import React, { useState } from "react";

function GridNumber({numRow, setNumRow,aspectRatio, setAspectRatio}) {

  const options = [
    { value: "1 / 1", label: "1 × 1" },
    { value: "4 / 6", label: "4 × 6" },
    { value: "6 / 4", label: "6 × 4" },
  ];

  //num col is calculated based on the selected aspect ratio and number of rows
  function calculateNumCol(numRow, aspectRatio) {
    if (aspectRatio === "1 / 1") {
      return numRow;
    } else if (aspectRatio === "4 / 6") {
      return Math.floor(numRow / 6 * 4);
    } else if (aspectRatio === "6 / 4") {
      return Math.floor(numRow / 4 * 6);
    }}

    console.log("numCol:", calculateNumCol(numRow, aspectRatio.value));

  return (
    <div>
      <span>Column</span>
      <input type="text" value={calculateNumCol(numRow, aspectRatio.value)} readOnly />
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
      <select value={aspectRatio.value} onChange={(e) => setAspectRatio({ value: e.target.value, label: e.target.options[e.target.selectedIndex].text })}>
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
