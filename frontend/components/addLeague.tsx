import React, { useState } from "react";
import { useContractWrite, useContractEvent } from "wagmi";
import { parseEther } from "ethers";
import Fantasy from "../artifacts/contracts/Fantasy.sol/Fantasy.json";
import styles from "../styles/Inputs.module.css";

const contractAddress = "0x8C486D366701f03b30a8106410ed98eF1660DBa4";

const AddLeague = () => {
  const [buyIn, setBuyin] = useState("");

  const { write, isLoading } = useContractWrite({
    address: contractAddress,
    abi: Fantasy.abi,
    functionName: "addSeason",
  });

  useContractEvent({
    address: contractAddress,
    abi: Fantasy.abi,
    eventName: "SeasonStarted",
    listener: (log: any[]) => {
      const seasonId = Number(log[0].args.seasonId);
      alert(`Your league id is: ${seasonId}`);
      console.log(log);
    },
  });

  const handleSubmit = (event: any) => {
    event.preventDefault();
    if (!isLoading) {
      write({ args: [parseEther(buyIn)] });
    }
  };

  return (
    <form className={styles.search} onSubmit={handleSubmit}>
      <h4>ADD YOUR LEAGUE</h4>
      <input
        type="text"
        placeholder="Enter Buy In"
        id="buyIn"
        value={buyIn}
        onChange={(event) => setBuyin(event.target.value)}
        required
      />
      <button>Add League</button>
    </form>
  );
};

export default AddLeague;
