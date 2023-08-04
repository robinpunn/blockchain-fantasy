import React from "react";
import FindLeague from "../components/findLeague";
import AddLeague from "../components/addLeague";
import BuyIn from "../components/buyIn";
import Navbar from "../components/navbar";
import styles from "../styles/Inputs.module.css";

const Inputs = () => {
  return (
    <>
      <Navbar />
      <main className={styles.connected}>
        <FindLeague />
        <AddLeague />
        <BuyIn />
      </main>
    </>
  );
};

export default Inputs;
