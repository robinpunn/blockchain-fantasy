import React, { useState } from "react";
import { useContractWrite, useContractEvent } from "wagmi";
import { parseEther } from "ethers";
import Fantasy from "../artifacts/contracts/Fantasy.sol/Fantasy.json";
import styles from "../styles/Inputs.module.css";

const contractAddress = "0x8C486D366701f03b30a8106410ed98eF1660DBa4";

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
        <label htmlFor="leagueId">League ID:</label>
        <input
          type="text"
          placeholder="Enter League Id"
          value={leagueId}
          onChange={(event) => setLeagueId(event.target.value)}
          required
        />
        <label htmlFor="buyInAmount">Buy In:</label>
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
