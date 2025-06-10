import React from "react";

function ContactForm(props){

    const { developerInfo } = props;

    return(
        <form>
            {developerInfo ? (
                <div>
                    <h4>The developer is {developerInfo.developer_name}</h4>
                    <p>Email: {developerInfo.developer_email}</p>
                    <p>Feel free to get in touch.</p>
                </div>
            ) : (
                <h4>The developer is... Feel free to get in touch.</h4>
            )}

            <p>
                <label htmlFor="email">Your email</label>
                <input type="email" id="email" required/>
            </p>
            <p>
                <label htmlFor="message">Message</label>
                <textarea id="message" required rows={5}/>
            </p>
            <button type="button" className="contact form-button" onClick={props.onClose}>
                Send
            </button>
        </form>
    )
}

export default ContactForm;