import React from "react";
import hero from "../assets/hero.png";

function Hero() {
  return (
    <div className="hero">
      <img className="hero-img" src={hero} alt="Hero" />
      <div className="hero-text">
        <h1>See your future home before you move in</h1>
        <h4>
          Experience your new home like never before – rotate, zoom, and walk
          through in 3D
        </h4>
      </div>
    </div>
  );
}

export default Hero;
