import React from "react";
import apartImg from "../assets/apartment-hero.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

function ApartmentHero() {
  return (
    <div className="apartment-hero">
      <h2>Choose your future place</h2>
      <div className="container">
        <div className="hero-item">
          <img className="image" src={apartImg}></img>
          <h4>A modern apartment - see its potential.</h4>
          <Link
          to="/product/Model1"
          state={{ modelName: "Model1" }}
          className="more link"
        >
          More <FontAwesomeIcon icon={faChevronRight} />
        </Link>


        </div>
      </div>
    </div>
  );
}

export default ApartmentHero;



     {/*<Link to="/product/Model1" className="more link">*/}
          {/*  More*/}
          {/*  {<FontAwesomeIcon icon={faChevronRight} />}*/}
          {/*</Link>*/}