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

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 解锁动画
  const [attemptCount, setAttemptCount] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [, setShowUnlockAnimation] = useState(false);

  // 检查是否处于锁定状态
  useEffect(() => {
    if (isLockedOut && lockoutTime > 0) {
      const timer = setTimeout(() => {
        setLockoutTime((prev) => {
          const newTime = prev - 1;
          // 当倒计时结束时，解除锁定状态
          if (newTime <= 0) {
            setIsLockedOut(false);
            setAttemptCount(0);
          }
          return newTime;
        });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isLockedOut, lockoutTime]);

  // 简单的密码混淆（实际项目中应该使用后端验证）
  const validatePassword = useCallback((input: string): boolean => {
    // 简单的混淆，实际项目中应该使用后端API验证
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
      // 密码正确，创建解锁令牌
      const unlockToken = btoa(`unlocked_${Date.now()}`);
      sessionStorage.setItem("unlockToken", unlockToken);

      setIsUnlocking(true);
      setShowUnlockAnimation(true);

      setTimeout(() => {
        if (onUnlock) {
          onUnlock();
        }
      }, 800);
    } else {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      setPasswordError(true);
      setPassword("");

      // 尝试3次后锁定30秒
      if (newAttemptCount >= 3) {
        setIsLockedOut(true);
        setLockoutTime(30);
      }

      setTimeout(() => {
        setPasswordError(false);
      }, 1000);
    }
  }, [attemptCount, onUnlock, password, validatePassword]);

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
      setPasswordError(false);
    },
    []
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleUnlock();
      }
    },
    [handleUnlock]
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

    // 为日期添加适当的间隔，美化显示
    return dateString.replace(
      /(\d{4})年(\d{1,2})月(\d{1,2})日(\S+)/,
      "$1年$2月$3日 $4"
    );
  }, [currentTime]);

  return (
    <div className={`lock-screen ${isUnlocking ? "unlocking" : ""}`}>
      {/* 模糊背景层 */}
      <div className="background-overlay"></div>

      {/* 锁屏内容 */}
      <div className="lock-content">
        {/* 时间显示 */}
        <motion.div
          className="time-section"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <motion.h1
            className="current-time"
            animate={{
              scale: [1, 1.02, 1],
            }}
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

        {/* 解锁区域 */}
        <motion.div
          className="unlock-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {isLockedOut ? (
            <motion.div
              className="lockout-container"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="lockout-message">🔒 账户已锁定</div>
              <div className="lockout-timer">请等待 {lockoutTime} 秒后重试</div>
            </motion.div>
          ) : !showPasswordInput ? (
            <motion.button
              className="unlock-btn"
              onClick={handleUnlock}
              whileHover={{
                scale: 1.1,
                backgroundColor: "rgba(255,255,255,0.2)",
              }}
              whileTap={{ scale: 0.95 }}
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                y: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                },
              }}
            >
              <motion.span
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  rotate: {
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse",
                  },
                }}
              >
                🔓
              </motion.span>
              <span>解锁</span>
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
                <input
                  type="password"
                  className={`password-input ${passwordError ? "error" : ""}`}
                  placeholder="请输入密码"
                  value={password}
                  onChange={handlePasswordChange}
                  onKeyPress={handleKeyPress}
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
                      : "密码错误，请重试"}
                  </motion.div>
                )}
              </div>
              <motion.button
                className="unlock-btn confirm-btn"
                onClick={handleUnlock}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🔓 确认解锁
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* 解锁动画层 */}
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
              🔓
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default LockScreen;
