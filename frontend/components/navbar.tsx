import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit';
import styles from "../styles/Navbar.module.css"

function Navbar() {
  return (
    <div className={styles.navbar}>
        <h1>Fantasy Payments</h1>
        <div className={styles.connect}>
          <ConnectButton
            accountStatus="avatar"
            showBalance={{
              smallScreen: false,
              largeScreen: true,
            }}
          />
        </div>
    </div>
  )
}

export default Navbar