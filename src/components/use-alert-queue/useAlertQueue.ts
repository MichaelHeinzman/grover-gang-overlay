"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { playAlertSound } from "@/lib/alert-sounds";

const CHANNEL_NAME = "grover-gang-alerts";

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
const MAX_VISIBLE = 4;

export function useAlertQueue() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const pendingQueue = useRef<Omit<AlertItem, "id">[]>([]);
  const timerMap = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const activeCount = useRef(0);

  const showAlert = useCallback((alert: Omit<AlertItem, "id">) => {
    const id = crypto.randomUUID();
    const newAlert: AlertItem = { ...alert, id };
    activeCount.current++;

    setAlerts((prev) => [...prev, newAlert]);
    playAlertSound(alert.type);

    const exitTimer = setTimeout(() => {
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, exiting: true } : a)),
      );

      const removeTimer = setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
        timerMap.current.delete(id);
        timerMap.current.delete(id + "-remove");
        activeCount.current--;

        // Promote next from queue if available
        if (pendingQueue.current.length > 0) {
          const next = pendingQueue.current.shift()!;
          showAlert(next);
        }
      }, EXIT_ANIMATION_DURATION);

      timerMap.current.set(id + "-remove", removeTimer);
    }, ALERT_DURATION);

    timerMap.current.set(id, exitTimer);
  }, []);

  const push = useCallback(
    (alert: Omit<AlertItem, "id">) => {
      if (activeCount.current < MAX_VISIBLE) {
        showAlert(alert);
      } else {
        pendingQueue.current.push(alert);
      }
    },
    [showAlert],
  );

  // Listen for test alerts from dashboard via BroadcastChannel
  useEffect(() => {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.onmessage = (e) => {
      if (e.data?.type === "test-alert") {
        push(e.data.alert);
      }
    };
    return () => bc.close();
  }, [push]);

  return { alerts, push };
}
