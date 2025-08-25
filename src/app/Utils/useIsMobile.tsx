import { useEffect, useState } from "react";

export function useIsMobile(breakpoint: number = 768): boolean | null {
  const [isMobile, setIsMobile] = useState<null | boolean>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [breakpoint]);

  return isMobile;
}
