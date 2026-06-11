// A component for selecting the number of rows and columns in the grid, as well as the aspect ratio (1:1, 4:6, 6:4)
import { set } from "immutable";
import React, { useState, useRef, useEffect } from "react";

function GridNumber({ numRow, setNumRow, aspectRatio, setAspectRatio }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          {/* Trigger button */}
          <button
            type="button"
            style = {{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px'}}
            onClick={() => setDropdownOpen((o) => !o)}
            >
            {aspectRatio.label}
            {/* Chevron */}
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{
                transform: `rotate(${dropdownOpen ? 180 : 0}deg)`,
                transition: 'transform 0.2s ease',
                color: 'var(--text-muted)',
                flexShrink: 0,
              }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {/* Dropdown list */}
          {dropdownOpen && (
            <ul className="dropdown">
              {options.map((opt) => (
                <li
                  key={opt.value}
                  onClick={() => { setAspectRatio(opt); setDropdownOpen(false); }}
                  style={{
                    padding: '7px 12px',
                    fontSize: '0.9em',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    color: opt.value === aspectRatio.value ? 'var(--ink-red)' : 'var(--text-dark)',
                    fontWeight: opt.value === aspectRatio.value ? 700 : 500,
                    background: opt.value === aspectRatio.value ? 'var(--bg-panel)' : 'transparent',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={e => { if (opt.value !== aspectRatio.value) e.currentTarget.style.background = 'var(--bg-panel)'; }}
                  onMouseLeave={e => { if (opt.value !== aspectRatio.value) e.currentTarget.style.background = 'transparent'; }}
                >
                  {opt.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </label>
    </div>
  );
}

export default GridNumber;
