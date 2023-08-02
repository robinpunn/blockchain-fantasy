import React from 'react'
import styles from '../styles/Welcome.module.css'

const Welcome = () => {
  return (
    <>
    <div className={styles.info}>
      <div className={styles.manager}>
        <h1>Managers</h1>
        <h4>Add your league</h4>
        <h4>Whitelist league members</h4>
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