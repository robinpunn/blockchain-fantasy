import React, { useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { IDContext } from "../context/IDContext";
import styles from "../styles/Inputs.module.css";

const FindLeague = () => {
  const [id, setId] = useContext(IDContext);
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (event: any) => {
    event.preventDefault();

    if (Number.isNaN(Number(inputValue))) {
      alert("Please enter a valid league ID.");
      return;
    }

    const sanitizedId = parseInt(inputValue);
    setId(sanitizedId);

    router.push("/league");
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  return (
    <form className={styles.search}>
      <h4>FIND YOUR LEAGUE</h4>
      <input
        type="text"
        placeholder="Enter League Id"
        id="league"
        value={inputValue}
        onChange={handleInputChange}
        required
      />
      <button onClick={handleSubmit}>Find</button>
    </form>
  );
};

export default FindLeague;
