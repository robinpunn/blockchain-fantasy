import React from "react";
import FindLeague from "../components/findLeague";
import AddLeague from "../components/addLeague";
import BuyIn from "../components/buyIn";
import Layout from "../components/layout";
import styles from "../styles/Inputs.module.css";

const Inputs = () => {
  return (
    <Layout>
      <section className={styles.connected}>
        <FindLeague />
        <AddLeague />
        <BuyIn />
      </section>
    </Layout>
  );
};

export default Inputs;
