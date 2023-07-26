import React from 'react'
import styles from "../styles/Contracts.module.css"

const Contracts = () => {
  return (
    <>
    <div className={styles.connected}>
        <div className={styles.search}>
            <p>Find your league:</p>
            <input type="text" placeholder='Enter League Address' />
            <button>Find</button>
        </div>
        <div className={styles.search}>
            <p>Create a League:</p>
            <input type="text" placeholder='Enter Buy In'/>
            <button>Create League</button>
        </div>
        <div className={styles.search}>
            <p>Buy in to an existing League:</p>
            <input type="text" placeholder='Enter League Address'/>
            <button>Buy In</button>
        </div>
    </div>
    </>
  )
}

export default Contracts