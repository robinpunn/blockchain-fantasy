import React from 'react'
import FindLeague from '../components/findLeague'
import AddLeague from '../components/addLeague'
import BuyIn from '../components/buyIn'
import Navbar from '../components/navbar'
import styles from "../styles/Contracts.module.css"

const Inputs = () => {
  return (
    <>
    <Navbar/>
    <div className={styles.connected}>
        <FindLeague/>
        <AddLeague />
        <BuyIn />
    </div>
    </>
  )
}

export default Inputs