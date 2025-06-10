import React, {useEffect, useState} from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faChevronDown, faChevronRight, faChevronUp} from "@fortawesome/free-solid-svg-icons";
import DetailRow from "./DetailRow";
import V3DApp from "./V3DApp";
import {useParams} from "react-router-dom";
import ContactForm from "./ContactForm.jsx";
import Modal from "./Modal.jsx";

function ApartmentDetails() {
  const [showMore, setShowMore] = useState(false);
  const { modelName } = useParams();

  console.log("Model name:", modelName)

  const [basicInfo, setBasicInfo] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [developerInfo, setDeveloperInfo] = useState(null);
  const [modalIsVisible, setModalIsVisible] = useState(false);

  function hideModal(){
    setModalIsVisible(false);
  }


  useEffect(() => {
    if (!modelName) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        // const baseURL = 'http://localhost:8000'; // lub http://127.0.0.1:8000

        const baseURL = 'https://zig-backend-nnq5.onrender.com';
        const basicResponse = await fetch(`${baseURL}/basic/${modelName}/`);
        if (!basicResponse.ok) {
          throw new Error('Failed to fetch basic info');
        }
        const basicData = await basicResponse.json();
        setBasicInfo(basicData);

        const roomsResponse = await fetch(`${baseURL}/rooms/${modelName}/`);
        if (!roomsResponse.ok) {
          throw new Error('Failed to fetch rooms info');
        }
        const roomsData = await roomsResponse.json();
        setRooms(roomsData.rooms || []);
        const developerResponse = await fetch(`${baseURL}/developer/${modelName}/`);
        if (!developerResponse.ok) {
          throw new Error('Failed to fetch developer info');
        }

        const developerData = await developerResponse.json();
        console.log(developerData + "dupa")
        setDeveloperInfo(developerData);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching apartment data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [modelName]);

  console.log("Model name:", modelName);
  console.log("Basic info:", basicInfo);
  console.log("Rooms:", rooms);
  console.log("Developer info:", developerInfo);


  // Loading state
  if (loading) {
    return (
      <div className="apartment-details">
        <div className="loading">Loading apartment details...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="apartment-details">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (!basicInfo) {
    return (
      <div className="apartment-details">
        <div className="error">No apartment data found for {modelName}</div>
      </div>
    );
  }

    return (
        <>
          {modalIsVisible?<Modal onClose={hideModal}><ContactForm onClose={hideModal} developerInfo={developerInfo}/></Modal>:null}
          <div className="apartment-details">
            <div className="details-item">
              <div className="verge3d-app">
                <V3DApp modelName={modelName} />
              </div>
              <div className="details">
                <h4>APARTMENT DETAILS </h4>
                <div className="info">
                <div className="details-box">
                  <DetailRow label="AREA" value={`${basicInfo.area_sum} m²`} />
                  <DetailRow label="FLOOR" value={basicInfo.floor} />
                  <DetailRow label="ROOMS" value={basicInfo.rooms_sum} />
                  <DetailRow label="ADDRESS" value={basicInfo.localisation} />
                  <DetailRow label="PRICE" value={`${basicInfo.price} zl `}/>

                  <button
                    className="toggle-button"
                    onClick={() => setShowMore(!showMore)}
                  >
                    <p>MORE DETAILS </p>
                    {showMore ? (
                      <FontAwesomeIcon icon={faChevronUp} />
                    ) : (
                      <FontAwesomeIcon icon={faChevronDown} />
                    )}
                  </button>

                  {showMore && (
                    <div className="more-details">
                      {rooms.length > 0 ? (
                        rooms.map((room, index) => (
                          <DetailRow
                            key={index}
                            label={room.name_room}
                            value={`${room.area} m²`}
                          />
                        ))
                      ) : (
                        <div>No rooms data available</div>
                      )}
                    </div>
                  )}
                </div>
                  <button className="contact link" onClick={()=>setModalIsVisible(true)}>
                    Contact with developer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
  );
}
//    return (
//     <div className="apartment-details">
//       <div className="details-item">
//         <div className="verge3d-app">
//           <V3DApp/>
//         </div>
//         {/*<iframe>*/}
//         {/*</iframe>*/}
//         <div className="details">
//           <h4>APARTMENT DETAILS</h4>
//           <div className="details-box">
//             <DetailRow label="AREA" value="102,8 m²"/>
//             <DetailRow label="FLOOR" value="1"/>
//             <DetailRow label="ROOMS" value="3"/>
//
//             <button
//                 className="toggle-button"
//                 onClick={() => setShowMore(!showMore)}
//             >
//               <p>MORE DETAILS </p>
//               {showMore ? (
//                   <FontAwesomeIcon icon={faChevronUp}/>
//               ) : (
//                   <FontAwesomeIcon icon={faChevronDown}/>
//               )}
//             </button>
//
//             {showMore && (
//                 <div className="more-details">
//                   <DetailRow label="Corridor" value="15,2 m²"/>
//                   <DetailRow label="Kitchen + Livingroom" value="33,5 m²"/>
//                   <DetailRow label="Walk-in closet" value="3,1 m²"/>
//                   <DetailRow label="Toilet" value="2 m²"/>
//                   <DetailRow label="Bathroom" value="6 m²"/>
//                   <DetailRow label="Room 1" value="10,5 m²"/>
//                   <DetailRow label="Room 2" value="12,4 m²"/>
//                   <DetailRow label="Room 3" value="13,5 m²"/>
//                   <DetailRow label="Office" value="6,6 m²"/>
//                 </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

export default ApartmentDetails;
