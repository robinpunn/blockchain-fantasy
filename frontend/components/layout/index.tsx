import React, { ReactNode } from "react";
import Navbar from "../navbar/index";
import styles from "../../styles/Home.module.css";

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className={styles.container}>{children}</main>
    </>
  );
};

export default Layout;
