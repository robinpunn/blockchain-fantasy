import React, { useState, useContext } from "react";
import { IDContext } from "../context/IDContext";
import { useContractWrite } from "wagmi";
import { parseEther } from "ethers";
import Fantasy from "../artifacts/contracts/Fantasy.sol/Fantasy.json";
import styles from "../styles/League.module.css";

const contractAddress = "0x8C486D366701f03b30a8106410ed98eF1660DBa4";

const Manager = () => {
  const [id] = useContext(IDContext);
  const [whitelistAddress, setWhitelistAddress] = useState("");
  const [winnings, setWinnings] = useState("");

  const {
    data: whitelistData,
    write: whitelistWrite,
    isLoading: isWhitelistLoading,
  } = useContractWrite({
    address: contractAddress,
    abi: Fantasy.abi,
    functionName: "addToWhitelist",
  });

  const {
    data: winData,
    write: winWrite,
    isLoading: isWinLoading,
  } = useContractWrite({
    address: contractAddress,
    abi: Fantasy.abi,
    functionName: "addWinnings",
  });

  const whitelistSubmit = (event: any) => {
    event.preventDefault();
    if (!isWhitelistLoading) {
      whitelistWrite({ args: [id, whitelistAddress] });
    }
  };

  const winSubmit = (event: any) => {
    event.preventDefault();
    if (!isWinLoading) {
      winWrite({ args: [id, parseEther(winnings)] });
    }
  };

  return (
    <>
      <form className={styles.whitelist} onSubmit={whitelistSubmit}>
        <h4>Whitelist</h4>
        <label htmlFor="whitelist">Whitelist Member:</label>
        <input
          type="text"
          placeholder="Enter address"
          id="whitelist"
          value={whitelistAddress}
          onChange={(event) => setWhitelistAddress(event.target.value)}
          required
        />
        <button>Add Member</button>
      </form>
      <form className={styles.add} onSubmit={winSubmit}>
        <h4>Handle Wins</h4>
        <label htmlFor="winnings">Add Winnings:</label>
        <input
          type="text"
          placeholder="Add win amount"
          value={winnings}
          onChange={(event) => setWinnings(event.target.value)}
        />
        <button type="submit">Add Winnings</button>
      </form>
    </>
  );
};

export default Manager;
