import React from 'react'
import styles from '../styles/Welcome.module.css'

const Welcome = () => {
  return (
    <>
    {/* <div className={styles.welcome}>
      <h1>Add Your League</h1>
      <h1>Buy In</h1>
      <h1>Withdraw</h1>
      <p>Launch a smart contract to handle the payments for your fantasy league.</p>
    </div> */}
    <div className={styles.info}>
      <div className={styles.manager}>
        <h1>Managers</h1>
        <h4>Launch your own smart contract</h4>
        <h4>Whitelist you league members</h4>
        <h4>Add winnings</h4>
      </div>
      <div className={styles.member}>
        <h1>Members</h1>
        <h4>Buy in to your league</h4>
        <h4>Withdraw your winnings</h4>
        <h4>Tip your commisioner</h4>
      </div>
    </div>
    </>
  )
}

export default Welcome