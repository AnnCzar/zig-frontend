import React from "react";
import {faChevronRight} from "@fortawesome/free-solid-svg-icons";
import {Link} from "react-router-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

function ApartmentCard(props) {
  return (
    <div className="card">
      <img className="image" src={props.image} alt="Apartment" />
      <h4>{props.title}</h4>
        {props.linkTo && (
        <div className="card-button-container">
          <Link
            to={props.linkTo}
            state={props.linkState}
            className="more-button"
          >
            More <FontAwesomeIcon icon={faChevronRight} />
          </Link>
        </div>
      )}
      <p>{props.description}</p>
    </div>
  );
}

export default ApartmentCard;
