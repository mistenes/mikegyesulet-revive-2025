import { useEffect, useState, RefObject } from "react";

export const useScrollAnimation = (ref: RefObject<HTMLElement>) => {
  // Default to visible so sections render even if IntersectionObserver is unavailable
  // or the observer fails to attach (e.g., some SSR/static hosts).
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [ref]);

  return isVisible;
};
