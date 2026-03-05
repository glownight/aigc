import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./styles.css";

interface LockScreenProps {
  onUnlock?: () => void;
}

const LockScreen = memo<LockScreenProps>(({ onUnlock }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [attemptCount, setAttemptCount] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isLockedOut && lockoutTime > 0) {
      const timer = setTimeout(() => {
        setLockoutTime((prev) => {
          const next = prev - 1;
          if (next <= 0) {
            setIsLockedOut(false);
            setAttemptCount(0);
          }
          return next;
        });
      }, 1000);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [isLockedOut, lockoutTime]);

  const validatePassword = useCallback((input: string): boolean => {
    const obfuscatedPassword = "55";
    return input === obfuscatedPassword;
  }, []);

  const handleUnlock = useCallback(() => {
    if (!showPasswordInput) {
      setShowPasswordInput(true);
      return;
    }

    if (isLockedOut) {
      setPasswordError(true);
      setPassword("");
      return;
    }

    if (validatePassword(password)) {
      const unlockToken = btoa(`unlocked_${Date.now()}`);
      sessionStorage.setItem("unlockToken", unlockToken);

      setIsUnlocking(true);

      setTimeout(() => {
        onUnlock?.();
      }, 800);
      return;
    }

    const nextAttemptCount = attemptCount + 1;
    setAttemptCount(nextAttemptCount);
    setPasswordError(true);
    setPassword("");

    if (nextAttemptCount >= 3) {
      setIsLockedOut(true);
      setLockoutTime(30);
    }

    setTimeout(() => {
      setPasswordError(false);
    }, 1000);
  }, [
    attemptCount,
    isLockedOut,
    onUnlock,
    password,
    showPasswordInput,
    validatePassword,
  ]);

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
      setPasswordError(false);
    },
    [],
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        handleUnlock();
      }
    },
    [handleUnlock],
  );

  const formatTime = useMemo(() => {
    return currentTime.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  }, [currentTime]);

  const formatDate = useMemo(() => {
    const dateString = currentTime.toLocaleDateString("zh-CN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return dateString.replace(
      /(\d{4})年(\d{1,2})月(\d{1,2})日(\S+)/,
      "$1年$2月$3日 $4",
    );
  }, [currentTime]);

  return (
    <div className={`lock-screen ${isUnlocking ? "unlocking" : ""}`}>
      <div className="background-overlay"></div>
      <div className="tech-grid"></div>
      <div className="ambient-glow ambient-glow-left"></div>
      <div className="ambient-glow ambient-glow-right"></div>

      <div className="lock-content">
        <motion.div
          className="lock-brand"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <span className="brand-tag">AIGC SECURE</span>
          <span className="brand-divider">/</span>
          <span className="brand-state">DEV WORKSPACE</span>
        </motion.div>

        <motion.div
          className="time-section"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <p className="time-caption">LOCAL SYSTEM TIME</p>
          <motion.h1
            className="current-time"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          >
            {formatTime}
          </motion.h1>
          <motion.p
            className="current-date"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
          >
            {formatDate}
          </motion.p>
        </motion.div>

        <motion.div
          className="unlock-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="security-meta">
            <span className="meta-dot"></span>
            <span>ENCRYPTED CHANNEL</span>
          </div>

          {isLockedOut ? (
            <motion.div
              className="lockout-container"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="lockout-message">SYSTEM LOCKED</div>
              <div className="lockout-timer">请等待 {lockoutTime} 秒后重试</div>
            </motion.div>
          ) : !showPasswordInput ? (
            <motion.button
              className="unlock-btn"
              onClick={handleUnlock}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              animate={{ y: [0, -3, 0] }}
              transition={{
                y: {
                  duration: 2.4,
                  repeat: Infinity,
                  repeatType: "reverse",
                },
              }}
            >
              <span className="btn-icon">[</span>
              <span>进入工作区</span>
              <span className="btn-icon">]</span>
            </motion.button>
          ) : (
            <motion.div
              className="password-input-container"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="attempt-info">
                剩余尝试次数: {3 - attemptCount}
              </div>
              <div className="password-input-wrapper">
                <span className="input-prefix">root@ai:~$</span>
                <input
                  type="password"
                  className={`password-input ${passwordError ? "error" : ""}`}
                  placeholder="输入访问密钥"
                  value={password}
                  onChange={handlePasswordChange}
                  onKeyDown={handleKeyPress}
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                {passwordError && (
                  <motion.div
                    className="password-error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {isLockedOut
                      ? "账户已锁定，请稍后重试"
                      : "密钥错误，请重新输入"}
                  </motion.div>
                )}
              </div>
              <motion.button
                className="unlock-btn confirm-btn"
                onClick={handleUnlock}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                执行解锁
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {isUnlocking && (
          <motion.div
            className="unlock-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="unlock-animation"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.5 }}
            >
              ACCESS GRANTED
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default LockScreen;
