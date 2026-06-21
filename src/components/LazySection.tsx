import { Suspense, useEffect, useRef, useState, ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  minHeight?: number;
}

export function LazySection({
  children,
  fallback,
  rootMargin = "200px",
  minHeight = 240,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [visible, rootMargin]);

  const placeholder = fallback ?? (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Skeleton className="h-6 w-48 mx-auto mb-4" />
      <Skeleton className="h-32 w-full" />
    </div>
  );

  return (
    <div ref={ref} style={{ minHeight: visible ? undefined : minHeight }}>
      {visible ? <Suspense fallback={placeholder}>{children}</Suspense> : placeholder}
    </div>
  );
}
