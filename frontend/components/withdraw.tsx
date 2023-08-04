import React from 'react'
import styles from '../styles/League.module.css'

const Withdraw = ({data}:any) => {
  return (
    <section className={styles.winnings}>
      <p>Winnings: {Number(data[2].result)}</p>
      <button>Withdraw</button>
    </section>
  )
}

export default Withdraw