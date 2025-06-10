import React from "react";
import ApartmentCard from "./ApartmentCard";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import apartImg1 from "../assets/apartment2.png";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import apartImg from "../assets/apartment.png";
import apartImg3 from "../assets/apartment3.png";

function FutureApartments() {
  return (
    <div className="apartment-cards">
      <h3>Future apartments coming soon</h3>
      <div className="container">
        <ApartmentCard
          description="A cozy apartment in the heart of Wrocław."
          image={apartImg1}
          linkTo="/product/Model3"
          linkState={{ modelName: "Model3" }}
        >
        </ApartmentCard>




        <ApartmentCard
          description="A modern and cozy apartment in the heart of the city."
          image={apartImg3}
          linkTo="/product/Model2"
          linkState={{ modelName: "Model2" }}
        />


        <ApartmentCard
          title="SOON"
          description="A warm and cozy interior with a view of the Odra."
          image={apartImg}
        />

      </div>
    </div>
  );
}

export default FutureApartments;
