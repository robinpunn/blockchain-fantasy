import React, { useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/router";
import styles from "../styles/Welcome.module.css";

const Welcome = () => {
  const router = useRouter();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) {
      router.push("/inputs");
    }
  }, [isConnected]);

  return (
    <>
      <article className={styles.info}>
        <section className={styles.manager}>
          <h1>Managers</h1>
          <h4 className={styles.text}>Add your league</h4>
          <h4 className={styles.text}>Whitelist league members</h4>
          <h4 className={styles.text}>Add winnings</h4>
        </section>
        <section className={styles.member}>
          <h1>Members</h1>
          <h4 className={styles.text}>Buy in to your league</h4>
          <h4 className={styles.text}>Withdraw your winnings</h4>
          <h4 className={styles.text}>Tip your commisioner</h4>
        </section>
      </article>
    </>
  );
};

export default Welcome;
