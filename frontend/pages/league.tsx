import React from 'react'
import Navbar from '../components/navbar'
import Manager from '../components/manager'
import styles from '../styles/League.module.css'
import LeagueInfo from '../components/leagueInfo'
import Withdraw from '../components/withdraw'

const League = () => {
  return (
    <>
      <Navbar/>
      <div className={styles.league}>
        <LeagueInfo />
        <Manager />
        <Withdraw />
      </div>
    </>
  )
}

export default League