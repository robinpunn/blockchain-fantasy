import React from 'react'
import styles from '../styles/League.module.css'

const LeagueInfo = () => {
  return (
    <>
      <section className={styles.id}>
          <p>League Id</p>
      </section>
      <section className={styles.prizepool}>
          <p>Prize Pool</p>
      </section>
    </>
  )
}

export default LeagueInfo