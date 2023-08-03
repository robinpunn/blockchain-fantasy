import React, { useEffect} from 'react'
import { useAccount } from 'wagmi';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Welcome.module.css';

const Welcome = () => {
  const router = useRouter();
  const { isConnected } = useAccount();

    useEffect(() => {
    if (isConnected) {
      router.push('/inputs')
    }
  }, [isConnected])

  return (
    <>
    <main>
      <article className={styles.info}>
      <section className={styles.manager}>
        <h1>Managers</h1>
        <h4>Add your league</h4>
        <h4>Whitelist league members</h4>
        <h4>Add winnings</h4>
      </section>
      <section className={styles.member}>
        <h1>Members</h1>
        <h4>Buy in to your league</h4>
        <h4>Withdraw your winnings</h4>
        <h4>Tip your commisioner</h4>
      </section>
      </article>
    </main>
    </>
  )
}

export default Welcome