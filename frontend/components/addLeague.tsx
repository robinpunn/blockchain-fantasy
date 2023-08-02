import React, {useState} from 'react'
import {useContractWrite, useContractEvent} from 'wagmi';
import { LogDescription, parseEther } from 'ethers';
import Fantasy from '../artifacts/contracts/Fantasy.sol/Fantasy.json';
import styles from '../styles/Contracts.module.css'

const contractAddress = "0x8C486D366701f03b30a8106410ed98eF1660DBa4"

const AddLeague = () => {
  const [buyIn, setBuyin] = useState('');

  const {write, isLoading, isSuccess} = useContractWrite({
    address: contractAddress,
    abi: Fantasy.abi,
    functionName: 'addSeason'
  })

  useContractEvent({
    address: contractAddress,
    abi: Fantasy.abi,
    eventName: 'SeasonStarted',
    listener: (log) => {
      const seasonId = log[0];
      const commissioner = log[1];
      alert(`Season ${seasonId.toString()} started by commissioner ${commissioner}!`);
      console.log(log)
    },
  });

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!isLoading) {
      await write({ args: [parseEther(buyIn)]})
    }
  }

  return (
      <form className={styles.search} onSubmit={handleSubmit}>
          <label htmlFor='buyIn'>Add A League:</label>
          <input
            type="text"
            placeholder='Enter Buy In'
            id="buyIn"
            value={buyIn}
            onChange={(event) => setBuyin(event.target.value)}
            required
          />
          <button>Add League</button>
      </form>
  )
}

export default AddLeague