import FutureApartments from "../components/FutureApartments";
import Header from "../components/Header";
import Hero from "../components/Hero";
import React from "react";
import ApartmentHero from "../components/ApartmentHero";

function Home() {
  return (
    <>
      <Header />
      <Hero />
      <ApartmentHero />
      <FutureApartments />
    </>
  );
}

export default Home;
