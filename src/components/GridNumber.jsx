// A component for selecting the number of rows and columns in the grid, as well as the aspect ratio (1:1, 4:6, 6:4)
import { set } from "immutable";
import React, { useState } from "react";

function GridNumber({ numRow, setNumRow, aspectRatio, setAspectRatio }) {

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
    }
  }

  console.log("numCol:", calculateNumCol(numRow, aspectRatio.value));

  return (
    <div className="input-fields-container">
      <label className="input-group">
        <span className="input-label">Row</span>
        <input
          className="input"
          type="number"
          value={numRow}
          min={16}
          max={32}
          onChange={(e) => setNumRow(Number(e.target.value))}
        />
      </label>

      <label className="input-group">
        <span className="input-label">Column</span>
        <div className="input-locked-wrapper">
          <input type="number" className="input readOnly" value={calculateNumCol(numRow, aspectRatio.value)} readOnly />
          <svg className="input-lock-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
      </label>

      <label className="input-group">
        <span className="input-label">Ratio</span>
        <select value={aspectRatio.value} className="input" onChange={(e) => setAspectRatio({ value: e.target.value, label: e.target.options[e.target.selectedIndex].text })}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export default GridNumber;
