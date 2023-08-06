import React, { useEffect, useContext } from "react";
import { IDContext } from "../context/IDContext";
import { formatEther, parseEther } from "ethers";
import { useContractWrite, useContractRead, useWalletClient } from "wagmi";
import Fantasy from "../artifacts/contracts/Fantasy.sol/Fantasy.json";
import styles from "../styles/League.module.css";

const contractAddress = "0x7BcF1609571b7a418aE68e42f2046338120A8f73";

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
    <form className={styles.winnings}>
      <h4>Withdraw Winnings</h4>
      {/* <p>Your Winnings: {formatEther(data)} ETH</p> */}
      <button className={styles.withdrawBtn} onClick={handleClick}>
        Withdraw
      </button>
    </form>
  );
};

export default Withdraw;
