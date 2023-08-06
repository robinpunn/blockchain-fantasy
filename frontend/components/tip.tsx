import React, { useState, useContext } from "react";
import { IDContext } from "../context/IDContext";
import { useContractWrite, useContractEvent } from "wagmi";
import { parseEther } from "ethers";
import Fantasy from "../artifacts/contracts/Fantasy.sol/Fantasy.json";
import styles from "../styles/League.module.css";

const contractAddress = "0x8C486D366701f03b30a8106410ed98eF1660DBa4";

const Tip = () => {
  const [tip, setTip] = useState("");
  const [id] = useContext(IDContext);

  const { write, isLoading } = useContractWrite({
    address: contractAddress,
    abi: Fantasy.abi,
    functionName: "tipCommissioner",
  });

  const handleSubmit = (event: any) => {
    event.preventDefault();
    if (!isLoading) {
      write({
        args: [id, parseEther(tip)],
        value: parseEther(tip),
      });
    }
  };

  return (
    <form className={styles.tip} onSubmit={handleSubmit}>
      <h4>Tip Commissioner</h4>
      <input
        type="text"
        placeholder="Enter tip amount"
        value={tip}
        onChange={(event) => setTip(event.target.value)}
        required
      />
      <button type="submit">Tip</button>
    </form>
  );
};

export default Tip;
