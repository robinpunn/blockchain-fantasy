import React, { useState } from 'react'
import styles from '../styles/Contracts.module.css'

const FindLeague = () => {
  const [id,setId] = useState('');

  const handleSubmit = (event: any) => {
    event.preventDefault();
  }

  return (
    <form className={styles.search}>
          <label htmlFor='buyIn'>Find Your League:</label>
          <input
            type="text"
            placeholder='Enter League Id'
            id="buyIn"
            value={id}
            onChange={(event) => setId(event.target.value)}
            required
          />
          <button>Find</button>
      </form>
  )
}

export default FindLeague