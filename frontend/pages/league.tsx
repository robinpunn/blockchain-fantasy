import React, { useContext } from 'react'
import {useContractReads} from 'wagmi';
import { IDContext, IDProvider } from '../context/IDContext';
import Fantasy from '../artifacts/contracts/Fantasy.sol/Fantasy.json';
import Navbar from '../components/navbar'
import styles from '../styles/League.module.css'



const address = "0x8C486D366701f03b30a8106410ed98eF1660DBa4"
const abi = Fantasy.abi

const League = () => {
  const [id] = useContext(IDContext);
  console.log("id",id)
  // const { data } = useContractReads({
  //   contracts: [
  //     {
  //       address: address,
  //       abi: abi,
  //       functionName: 'getSeasonPrizePool',
  //       args: [id]
  //     },
  //     {
  //       address: address,
  //       abi: abi,
  //       functionName: 'getSeasonCommissioner',
  //       args: [id]
  //     },
  //     {
  //       address: address,
  //       abi: abi,
  //       functionName: 'getSeasonWinnings',
  //       args: [id]
  //     },
  //   ],
  // })
  // console.log(data)
  return (
    <>
      <Navbar/>
      <main className={styles.league}>
        <section className={styles.id}>
            <p>League Id {id} </p>
            <p>{id}</p>
        </section>
        <section className={styles.prizepool}>
            <p>Prize Pool</p>
        </section>
        <section className={styles.whiteList}>
          <p>Whitelist Members</p>
          <button>Add Member</button>
        </section>
        <section className={styles.add}>
            <p>Add Winnings</p>
            <button>Add Winnings</button>
        </section>
        <section className={styles.winnings}>
            <p>Winnings</p>
            <button>Withdraw</button>
        </section>
      </main>
    </>
  )
}

export default League