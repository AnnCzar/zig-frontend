import React from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";  // ← DODAJ
import App from "./components/App";

// ✅ DODAJ basename dla GitHub Pages
const basename = import.meta.env.MODE === 'production' ? '/zig-frontend' : '';

console.log('Current mode:', import.meta.env.MODE);
console.log('Basename:', basename);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename={basename}>  {/* ← DODAJ */}
      <App />
    </BrowserRouter>  {/* ← DODAJ */}
  </StrictMode>
);
