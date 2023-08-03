import React, { useContext, useState, useEffect } from 'react'
import Link from 'next/link';
import { useRouter } from 'next/router';
import { IDContext } from '../context/IDContext';
import styles from '../styles/Contracts.module.css'

const FindLeague = () => {
  const [id, setId] = useContext(IDContext);
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (event: any) => {
    event.preventDefault();
    console.log('Submit button clicked');

    if (Number.isNaN(Number(inputValue))) {
      alert('Please enter a valid league ID.');
      return;
    }

    const sanitizedId = parseInt(inputValue);
    console.log("sani:",sanitizedId);
    setId(sanitizedId);
    console.log("id:", id)

    router.push('/league')
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  }

  return (
    <form className={styles.search}>
      <label htmlFor='league'>Find Your League:</label>
      <input
        type="text"
        placeholder='Enter League Id'
        id="league"
        value={inputValue}
        onChange={handleInputChange}
        required
      />
      <button onClick={handleSubmit}>Find</button>
    </form>
  )
}

export default FindLeague;
