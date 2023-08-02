import React, {useState} from 'react'
import styles from '../styles/Contracts.module.css'

const AddLeague = () => {
  const [buyIn, setBuyin] = useState(null);

  return (
    <form className={styles.search}>
        <p>Add a League:</p>
        <input type="text" placeholder='Enter Buy In'/>
        <button>Add League</button>
    </form>
  )
}

export default AddLeague