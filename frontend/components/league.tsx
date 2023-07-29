import React from 'react'
import styles from '../styles/League.module.css'

const League = () => {
  return (
    <>
    <div className={styles.prizepool}>
        <p>Prize Pool</p>
    </div>
    <div className={styles.add}>
        <p>Add Winnings</p>
        <button>Add Winnings</button>
    </div>
    <div className={styles.winnings}>
        <p>Winnings</p>
        <button>Withdraw</button>
    </div>
    <div className={styles.tip}>
        <p>Tip the Commish</p>
        <button>Tip</button>
    </div>
    </>
  )
}

export default League