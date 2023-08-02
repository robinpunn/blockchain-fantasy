import Link from 'next/link'
import React, { useEffect } from 'react'
import { useRouter } from 'next/router';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import styles from "../styles/Navbar.module.css"

function Navbar() {
  const router = useRouter();
  const { address } = useAccount();

  useEffect(() => {
    if (address) {
      router.push('/inputs')
    } else {
      router.push("/")
    }
  }, [address])

  return (
    <div className={styles.navbar}>
      <Link href={address? "/inputs" : "/"}><h3>Fantasy Payments</h3></Link>

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