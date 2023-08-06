import React, { useState } from "react";
import { useContractWrite, useContractEvent } from "wagmi";
import { parseEther } from "ethers";
import Fantasy from "../artifacts/contracts/Fantasy.sol/Fantasy.json";
import styles from "../styles/Inputs.module.css";

const contractAddress = "0x7BcF1609571b7a418aE68e42f2046338120A8f73";

const BuyIn = () => {
  const [leagueId, setLeagueId] = useState("");
  const [buyInAmount, setBuyInAmount] = useState("");

  const { write, isLoading } = useContractWrite({
    address: contractAddress,
    abi: Fantasy.abi,
    functionName: "buyIn",
  });

  useContractEvent({
    address: contractAddress,
    abi: Fantasy.abi,
    eventName: "MemberJoined",
    listener: (log: any[]) => {
      const seasonId = Number(log[0].args.seasonId);
      alert(`Buy in successful for League ID: ${seasonId}`);
      console.log(log);
    },
  });

  const handleSubmit = (event: any) => {
    event.preventDefault();
    if (!isLoading) {
      write({
        args: [leagueId, parseEther(buyInAmount)],
        value: parseEther(buyInAmount),
      });
    }
  };

  return (
    <>
      <form className={styles.search} onSubmit={handleSubmit}>
        <h4>BUY IN</h4>
        <input
          type="text"
          placeholder="Enter League Id"
          value={leagueId}
          onChange={(event) => setLeagueId(event.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Enter Buy In"
          value={buyInAmount}
          onChange={(event) => setBuyInAmount(event.target.value)}
          required
        />
        <button type="submit">Buy In</button>
      </form>
    </>
  );
};

export default BuyIn;
