import React from "react";

function Modal(props){
    return(
        <>
            <div className="backdrop" onClick={props.onClose}/>
            <dialog open className="modal">{props.children}</dialog>
        </>
    )

}

export default Modal;