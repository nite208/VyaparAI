import { useEffect, useState } from "react";

/** Returns true only after client mount — used to gate localStorage-backed UI on SSR. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
