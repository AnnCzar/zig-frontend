import React from "react";

function DetailRow(props) {
  return (
    <div className="detail-row">
      <p className="detail-label">{props.label}</p>
      <p className="detail-value">{props.value}</p>
    </div>
  );
}

export default DetailRow;
