import React from "react";
import { Link } from "react-router-dom";

function Header() {
  return (
    <header>
      <Link to="/" className="link">
        <h2>VIRTUALSPACE</h2>
      </Link>
    </header>
  );
}

export default Header;
