import { useEffect } from "react";

let noIndexCount = 0;

export function NoIndex() {
  useEffect(() => {
    noIndexCount++;

    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    meta.content = "noindex, nofollow";

    return () => {
      noIndexCount--;
      if (noIndexCount === 0 && meta) {
        meta.content = "index, follow";
      }
    };
  }, []);

  return null;
}
