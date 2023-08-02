import React from 'react'
import styles from '../styles/League.module.css'

const LeagueInfo = () => {
  return (
    <>
      <div className={styles.id}>
          <p>League Id</p>
      </div>
      <div className={styles.prizepool}>
          <p>Prize Pool</p>
      </div>
    </>
  )
}

export default LeagueInfo