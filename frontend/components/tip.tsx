import React, { useState, useContext } from "react";
import { IDContext } from "../context/IDContext";
import { useContractWrite } from "wagmi";
import { parseEther } from "ethers";
import Fantasy from "../artifacts/contracts/Fantasy.sol/Fantasy.json";
import styles from "../styles/League.module.css";

const contractAddress = "0x7BcF1609571b7a418aE68e42f2046338120A8f73";

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
