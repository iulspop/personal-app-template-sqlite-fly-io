import { IconLoader2 } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useNavigation } from "react-router";
import { useSpinDelay } from "spin-delay";

import { cn } from "~/lib/utils";

export function ProgressBarComponent() {
  const transition = useNavigation();
  const busy = transition.state !== "idle";
  const delayedPending = useSpinDelay(busy, {
    delay: 600,
    minDuration: 400,
  });
  const ref = useRef<HTMLDivElement>(null);
  const [animationComplete, setAnimationComplete] = useState(true);

  useEffect(() => {
    if (!ref.current) return;
    if (delayedPending) setAnimationComplete(false);

    const animationPromises = ref.current
      .getAnimations()
      .map(({ finished }) => finished);

    void Promise.allSettled(animationPromises).then(() => {
      if (!delayedPending) setAnimationComplete(true);
    });
  }, [delayedPending]);

  return (
    <div
      aria-hidden={delayedPending ? undefined : true}
      aria-valuetext={delayedPending ? "Loading" : undefined}
      className="fixed inset-x-0 top-0 z-50 h-[0.20rem] animate-pulse"
      role="progressbar"
    >
      <div
        className={cn(
          "bg-foreground h-full w-0 duration-500 ease-in-out",
          transition.state === "idle" &&
            (animationComplete
              ? "transition-none"
              : "w-full opacity-0 transition-all"),
          delayedPending && transition.state === "submitting" && "w-5/12",
          delayedPending && transition.state === "loading" && "w-8/12",
        )}
        ref={ref}
      />
      {delayedPending && (
        <div className="absolute flex items-center justify-center">
          <IconLoader2
            aria-hidden
            className="text-foreground m-1 animate-spin"
            size={16}
          />
        </div>
      )}
    </div>
  );
}
