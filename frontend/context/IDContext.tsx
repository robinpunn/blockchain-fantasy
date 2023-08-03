import { createContext, useState, ReactNode } from "react";

type IDContextType = [number | string | null, React.Dispatch<React.SetStateAction<number | string | null>>];

export const IDContext = createContext<IDContextType>([null, () => {}]);

export const IDProvider = ({ children }: { children: ReactNode }) => {
  const [id, setId] = useState<number | string | null>('');

  return (
    <IDContext.Provider value={[id, setId]}>
      {children}
    </IDContext.Provider>
  );
};