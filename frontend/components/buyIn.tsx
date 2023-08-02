import React from 'react'
import styles from '../styles/Contracts.module.css'

const BuyIn = () => {
  return (
    <div className={styles.search}>
        <p>Buy in to an existing League:</p>
        <input type="text" placeholder='Enter League Id'/>
        <input type="text" placeholder='Enter Buy In' />
        <button>Buy In</button>
    </div>
  )
}

export default BuyIn