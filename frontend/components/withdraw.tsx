import React, { useEffect, useContext } from "react";
import { IDContext } from "../context/IDContext";
import { formatEther, parseEther } from "ethers";
import { useContractWrite, useContractRead, useWalletClient } from "wagmi";
import Fantasy from "../artifacts/contracts/Fantasy.sol/Fantasy.json";
import styles from "../styles/League.module.css";

const contractAddress = "0x8C486D366701f03b30a8106410ed98eF1660DBa4";

const Withdraw = () => {
  const [id] = useContext(IDContext);
  console.log("withdrawId:", id);

  const { write, isLoading } = useContractWrite({
    address: contractAddress,
    abi: Fantasy.abi,
    functionName: "withdrawWinnings",
  });

  // const { data } = useContractRead({
  //   address: contractAddress,
  //   abi: Fantasy.abi,
  //   functionName: "getSeasonWinnings",
  //   args: [id],
  // });

  const handleClick = () => {
    if (!isLoading) {
      write({ args: [id] });
    }
  };

  return (
    <section className={styles.winnings}>
      <h4>Withdraw Winnings</h4>
      {/* <p>Your Winnings: {formatEther(data)} ETH</p> */}
      <button onClick={handleClick}>Withdraw</button>
    </section>
  );
};

export default Withdraw;
