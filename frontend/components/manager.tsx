import React from 'react'
import styles from '../styles/League.module.css'

const Manager = () => {
  return (
    <>
    <div className={styles.whiteList}>
        <p>Whitelist Members</p>
        <button>Add Member</button>
    </div>
    <div className={styles.add}>
        <p>Add Winnings</p>
        <button>Add Winnings</button>
    </div>
    </>
  )
}

export default Manager