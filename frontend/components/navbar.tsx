import Link from 'next/link'
import React, { useEffect, useContext } from 'react'
import { IDContext } from '../context/IDContext';
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import styles from "../styles/Navbar.module.css"

function Navbar() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [id] = useContext(IDContext);

  useEffect(() => {
    if (!isConnected) {
      router.push('/')
    }
  }, [!isConnected])

  return (
    <div className={styles.navbar}>
      <Link href={isConnected? "/inputs" : "/"}><h3>Fantasy Payments</h3></Link>

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