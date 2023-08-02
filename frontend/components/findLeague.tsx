import React from 'react'
import styles from '../styles/Contracts.module.css'

const FindLeague = () => {
  return (
    <div className={styles.search}>
        <p>Find your league:</p>
        <input type="text" placeholder='Enter League Id' />
        <button>Find</button>
    </div>
  )
}

export default FindLeague