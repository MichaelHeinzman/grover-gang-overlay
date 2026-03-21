"use client";

import { useState, useCallback, useRef } from "react";

export interface AlertItem {
  id: string;
  type: string;
  title: string;
  message: string;
  color: string;
  icon: string;
  exiting?: boolean;
}

const ALERT_DURATION = 5000;
const EXIT_ANIMATION_DURATION = 400;

export function useAlertQueue() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const timerMap = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const push = useCallback((alert: Omit<AlertItem, "id">) => {
    const id = crypto.randomUUID();
    const newAlert: AlertItem = { ...alert, id };

    setAlerts((prev) => [...prev, newAlert]);

    const exitTimer = setTimeout(() => {
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, exiting: true } : a)),
      );

      const removeTimer = setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
        timerMap.current.delete(id);
      }, EXIT_ANIMATION_DURATION);

      timerMap.current.set(id + "-remove", removeTimer);
    }, ALERT_DURATION);

    timerMap.current.set(id, exitTimer);
  }, []);

  return { alerts, push };
}
