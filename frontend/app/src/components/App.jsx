import React, { useEffect } from "react";
import Home from "../pages/Home";
import Product from "../pages/Product";
import { Routes, Route } from "react-router-dom";  // ← USUŃ BrowserRouter

function App() {
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
  }, []);

  return (
    // ❌ USUŃ: <BrowserRouter>
    <Routes>  {/* ← BEZ BrowserRouter wrapper */}
      <Route path="/" element={<Home />} />
      <Route path="/product/:modelName" element={<Product />} />
    </Routes>
    // ❌ USUŃ: </BrowserRouter>
  );
}

export default App;
