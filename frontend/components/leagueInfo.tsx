import React, { useContext } from "react";
import { IDContext } from "../context/IDContext";
import { formatEther } from "ethers";
import styles from "../styles/League.module.css";

const LeagueInfo = ({ data }: any) => {
  const [id] = useContext(IDContext);
  return (
    <>
      <section className={styles.id}>
        <p>League Id: {id} </p>
      </section>
      <section className={styles.prizepool}>
        <p>Prize Pool: {formatEther(data[1].result)} ETH</p>
      </section>
    </>
  );
};

export default LeagueInfo;
