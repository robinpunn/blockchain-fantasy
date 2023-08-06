import React, { useContext, useState, useEffect } from "react";
import { useContractReads } from "wagmi";
import { useAccount } from "wagmi";
import { IDContext } from "../context/IDContext";
import Fantasy from "../artifacts/contracts/Fantasy.sol/Fantasy.json";
import Navbar from "../components/navbar";
import LeagueInfo from "../components/leagueInfo";
import Manager from "../components/manager";
import Withdraw from "../components/withdraw";
import Tip from "../components/tip";
import styles from "../styles/League.module.css";

const contract = "0x7BcF1609571b7a418aE68e42f2046338120A8f73";
const abi = Fantasy.abi;

const League = () => {
  const [id] = useContext(IDContext) ?? "";
  const { address } = useAccount();

  const { data } = useContractReads({
    contracts: [
      {
        address: contract,
        abi: abi,
        functionName: "getSeasonCommissioner",
        args: [id],
      },
      {
        address: contract,
        abi: abi,
        functionName: "getSeasonPrizePool",
        args: [id],
      },
      // {
      //   address: contract,
      //   abi: abi,
      //   functionName: 'getSeasonWinnings',
      //   args: [id]
      // },
    ],
  });

  return (
    <>
      <Navbar />
      <main className={styles.league}>
        {data && (
          <>
            <LeagueInfo data={data} />
            <section className={styles.actions}>
              <Withdraw />
              {address !== data[0].result && <Tip />}
              {address === data[0].result && <Manager />}
            </section>
          </>
        )}
      </main>
    </>
  );
};

export default League;
