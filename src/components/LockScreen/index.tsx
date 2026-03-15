import { memo, useEffect, useRef, useState } from "react";
import "./styles.css";

interface LockScreenProps {
  onUnlock?: () => void;
  onPrepareUnlock?: () => void;
}

type ThreeModule = typeof import("three");
type ExtendedDateTimeFormatPart = Intl.DateTimeFormatPart & {
  type: string;
};

const HOLD_DURATION = 1500;
const UNLOCK_DELAY = 2000;
const PROGRESS_SIZE = 80;
const PROGRESS_RADIUS = 38;
const LUNAR_DATE_FORMATTER = new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
  year: "numeric",
  month: "long",
  day: "numeric",
});
const WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
const LUNAR_FESTIVALS: Record<string, string> = {
  正月初一: "春节",
  正月十五: "元宵",
  二月初二: "龙抬头",
  五月初五: "端午",
  七月初七: "七夕",
  七月十五: "中元",
  八月十五: "中秋",
  九月初九: "重阳",
  腊月初八: "腊八",
  腊月廿三: "小年",
  腊月廿四: "小年",
};

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform float u_interaction;
  varying vec2 vUv;

  vec3 permute(vec3 x) {
    return mod(((x * 34.0) + 1.0) * x, 289.0);
  }

  float snoise(vec2 v) {
    const vec4 C = vec4(
      0.211324865405187,
      0.366025403784439,
      -0.577350269189626,
      0.024390243902439
    );

    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;

    i = mod(i, 289.0);
    vec3 p = permute(
      permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0)
    );

    vec3 m = max(
      0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)),
      0.0
    );
    m = m * m;
    m = m * m;

    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;

    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);

    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 x) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));

    for (int i = 0; i < 5; ++i) {
      v += a * snoise(x);
      x = rot * x * 2.0 + shift;
      a *= 0.5;
    }

    return v;
  }

  void main() {
    vec2 st = gl_FragCoord.xy / u_resolution.xy;
    st.x *= u_resolution.x / u_resolution.y;

    vec2 q = vec2(0.0);
    q.x = fbm(st + 0.00 * u_time);
    q.y = fbm(st + vec2(1.0));

    vec2 r = vec2(0.0);
    r.x = fbm(st + 1.0 * q + vec2(1.7, 9.2) + 0.15 * u_time + u_interaction * 0.5);
    r.y = fbm(st + 1.0 * q + vec2(8.3, 2.8) + 0.126 * u_time - u_interaction);

    float f = fbm(st + r);

    vec3 color_void = vec3(0.04, 0.043, 0.04);
    vec3 color_earth = vec3(0.11, 0.114, 0.10);
    vec3 color_leaf = vec3(0.21, 0.24, 0.20);

    vec3 color = mix(color_void, color_earth, clamp((f * f) * 4.0, 0.0, 1.0));
    color = mix(color, color_leaf, clamp(length(q), 0.0, 1.0));
    color -= 0.2 * length(st - vec2(0.5 * u_resolution.x / u_resolution.y, 0.5));

    float distToCenter = length(st - vec2(0.5 * u_resolution.x / u_resolution.y, 0.1));
    float glow = smoothstep(0.8, 0.0, distToCenter) * u_interaction * 0.5;
    color += vec3(0.4, 0.45, 0.35) * glow;

    gl_FragColor = vec4(color, 1.0);
  }
`;

let threeModulePromise: Promise<ThreeModule> | null = null;

const loadThreeModule = () => {
  if (!threeModulePromise) {
    threeModulePromise = import("three");
  }

  return threeModulePromise;
};

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function getPixelRatio() {
  const deviceInfo = navigator as Navigator & {
    deviceMemory?: number;
  };

  const devicePixelRatio = window.devicePixelRatio || 1;
  const lowEndDevice =
    (typeof deviceInfo.deviceMemory === "number" &&
      deviceInfo.deviceMemory <= 4) ||
    navigator.hardwareConcurrency <= 4;

  return Math.min(devicePixelRatio, lowEndDevice ? 1.25 : 2);
}

function formatTime(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  let meridian = "上午";

  if (totalMinutes < 6 * 60) {
    meridian = "凌晨";
  } else if (totalMinutes < 9 * 60) {
    meridian = "清晨";
  } else if (totalMinutes < 11 * 60 + 30) {
    meridian = "上午";
  } else if (totalMinutes < 13 * 60) {
    meridian = "中午";
  } else if (totalMinutes < 18 * 60) {
    meridian = "下午";
  } else {
    meridian = "晚上";
  }

  return {
    meridian,
    display: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
  };
}

function formatChineseLunarDay(dayNumber: number) {
  const numerals = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

  if (dayNumber <= 0 || dayNumber > 30) {
    return String(dayNumber);
  }

  if (dayNumber === 10) {
    return "初十";
  }

  if (dayNumber === 20) {
    return "二十";
  }

  if (dayNumber === 30) {
    return "三十";
  }

  if (dayNumber < 10) {
    return `初${numerals[dayNumber]}`;
  }

  if (dayNumber < 20) {
    return `十${numerals[dayNumber - 10]}`;
  }

  return `廿${numerals[dayNumber - 20]}`;
}

function getLunarParts(date: Date) {
  const parts = LUNAR_DATE_FORMATTER.formatToParts(date) as ExtendedDateTimeFormatPart[];
  const yearName = parts.find((part) => String(part.type) === "yearName")?.value;
  const month = parts.find((part) => String(part.type) === "month")?.value;
  const dayValue = parts.find((part) => String(part.type) === "day")?.value;
  const dayNumber = Number(dayValue);

  if (!yearName || !month || Number.isNaN(dayNumber)) {
    return null;
  }

  return {
    yearName,
    month,
    dayNumber,
    dayLabel: formatChineseLunarDay(dayNumber),
  };
}

function formatLunarInfo(date: Date) {
  try {
    const lunarParts = getLunarParts(date);
    if (!lunarParts) {
      throw new Error("Missing lunar date parts.");
    }

    const { yearName, month, dayLabel } = lunarParts;
    const festivalKey = `${month}${dayLabel}`;
    const nextDayParts = getLunarParts(new Date(date.getTime() + 24 * 60 * 60 * 1000));
    const festivalLabel =
      LUNAR_FESTIVALS[festivalKey] ||
      (month.includes("腊月") && nextDayParts?.month === "正月" ? "除夕" : "") ||
      WEEKDAY_LABELS[date.getDay()];

    return {
      yearLabel: `[${yearName}年]`,
      dateLabel: `${month}${dayLabel}`,
      detailLabel: festivalLabel,
    };
  } catch {
    return {
      yearLabel: "[公历]",
      dateLabel: date.toLocaleDateString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
      }),
      detailLabel: WEEKDAY_LABELS[date.getDay()],
    };
  }
}

function SilentIcon() {
  return (
    <svg className="sys-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg className="sys-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg className="sys-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
    </svg>
  );
}

const LockScreen = memo<LockScreenProps>(({ onUnlock, onPrepareUnlock }) => {
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [isPressing, setIsPressing] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const webglContainerRef = useRef<HTMLDivElement>(null);
  const progressCanvasRef = useRef<HTMLCanvasElement>(null);
  const progressFrameRef = useRef<number | null>(null);
  const unlockTimeoutRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const pressStartRef = useRef(0);
  const interactionRef = useRef(0);
  const isPressingRef = useRef(false);
  const isUnlockedRef = useRef(false);

  const { display, meridian } = formatTime(currentTime);
  const { yearLabel, dateLabel, detailLabel } = formatLunarInfo(currentTime);
  const statusText = isUnlocked ? "已解锁" : isPressing ? "正在唤醒..." : "长按以苏醒";

  const drawProgress = () => {
    const canvas = progressCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, PROGRESS_SIZE, PROGRESS_SIZE);

    if (progressRef.current <= 0) {
      return;
    }

    context.beginPath();
    context.arc(
      PROGRESS_SIZE / 2,
      PROGRESS_SIZE / 2,
      PROGRESS_RADIUS,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * progressRef.current,
    );
    context.strokeStyle = "#e3decb";
    context.lineWidth = 2;
    context.lineCap = "round";
    context.stroke();
  };

  const stopProgressLoop = () => {
    if (progressFrameRef.current !== null) {
      window.cancelAnimationFrame(progressFrameRef.current);
      progressFrameRef.current = null;
    }
  };

  const triggerUnlock = () => {
    if (isUnlockedRef.current) {
      return;
    }

    onPrepareUnlock?.();
    isUnlockedRef.current = true;
    isPressingRef.current = false;
    progressRef.current = 1;
    interactionRef.current = 2;
    stopProgressLoop();
    drawProgress();
    setIsPressing(false);
    setIsUnlocked(true);

    sessionStorage.setItem("unlockToken", btoa(`unlocked_${Date.now()}`));

    if (unlockTimeoutRef.current !== null) {
      window.clearTimeout(unlockTimeoutRef.current);
    }

    unlockTimeoutRef.current = window.setTimeout(() => {
      onUnlock?.();
    }, UNLOCK_DELAY);
  };

  const stepProgress = (timestamp: number) => {
    if (isUnlockedRef.current) {
      progressFrameRef.current = null;
      return;
    }

    if (isPressingRef.current) {
      progressRef.current = Math.min(
        (timestamp - pressStartRef.current) / HOLD_DURATION,
        1,
      );
      interactionRef.current = lerp(interactionRef.current, 1, 0.05);

      if (progressRef.current >= 1) {
        triggerUnlock();
        return;
      }
    } else {
      progressRef.current = Math.max(0, progressRef.current - 0.05);
      interactionRef.current = lerp(interactionRef.current, 0, 0.05);
    }

    drawProgress();

    if (
      isPressingRef.current ||
      progressRef.current > 0 ||
      interactionRef.current > 0.01
    ) {
      progressFrameRef.current = window.requestAnimationFrame(stepProgress);
      return;
    }

    progressFrameRef.current = null;
  };

  const ensureProgressLoop = () => {
    if (progressFrameRef.current === null) {
      progressFrameRef.current = window.requestAnimationFrame(stepProgress);
    }
  };

  const beginPress = () => {
    if (isUnlockedRef.current || isPressingRef.current) {
      return;
    }

    onPrepareUnlock?.();
    isPressingRef.current = true;
    pressStartRef.current = performance.now() - progressRef.current * HOLD_DURATION;
    interactionRef.current = Math.max(interactionRef.current, progressRef.current);
    setIsPressing(true);
    ensureProgressLoop();
  };

  const releasePress = () => {
    if (isUnlockedRef.current || !isPressingRef.current) {
      return;
    }

    isPressingRef.current = false;
    setIsPressing(false);
    ensureProgressLoop();
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const canvas = progressCanvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    canvas.width = PROGRESS_SIZE;
    canvas.height = PROGRESS_SIZE;
    drawProgress();
  }, []);

  useEffect(() => {
    const handlePointerUp = () => {
      releasePress();
    };

    const handleBlur = () => {
      releasePress();
    };

    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    const container = webglContainerRef.current;
    if (!container) {
      return;
    }

    let cancelled = false;
    let disposeScene: (() => void) | null = null;
    const startTimer = window.setTimeout(() => {
      void (async () => {
        try {
          const THREE = await loadThreeModule();
          if (cancelled || !container.isConnected) {
            return;
          }

          const scene = new THREE.Scene();
          const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
          const uniforms = {
            u_time: { value: 0 },
            u_resolution: {
              value: new THREE.Vector2(window.innerWidth, window.innerHeight),
            },
            u_interaction: { value: 0 },
          };

          const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: false,
            powerPreference: "low-power",
          });
          renderer.setPixelRatio(getPixelRatio());
          renderer.setSize(window.innerWidth, window.innerHeight);
          container.appendChild(renderer.domElement);

          const geometry = new THREE.PlaneGeometry(2, 2);
          const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
          });
          const mesh = new THREE.Mesh(geometry, material);
          const clock = new THREE.Clock();

          scene.add(mesh);

          let frameId: number | null = null;

          const stopRender = () => {
            if (frameId !== null) {
              window.cancelAnimationFrame(frameId);
              frameId = null;
            }
          };

          const renderFrame = () => {
            uniforms.u_time.value = clock.getElapsedTime();
            uniforms.u_interaction.value = lerp(
              uniforms.u_interaction.value,
              interactionRef.current,
              isUnlockedRef.current ? 0.08 : 0.05,
            );

            renderer.render(scene, camera);
            frameId = window.requestAnimationFrame(renderFrame);
          };

          const startRender = () => {
            if (document.hidden || frameId !== null || cancelled) {
              return;
            }

            frameId = window.requestAnimationFrame(renderFrame);
          };

          const handleResize = () => {
            renderer.setPixelRatio(getPixelRatio());
            renderer.setSize(window.innerWidth, window.innerHeight);
            uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
          };

          const handleVisibilityChange = () => {
            if (document.hidden) {
              stopRender();
            } else {
              startRender();
            }
          };

          const handleContextLost = (event: Event) => {
            event.preventDefault();
            stopRender();
          };

          const handleContextRestored = () => {
            startRender();
          };

          renderer.domElement.addEventListener(
            "webglcontextlost",
            handleContextLost as EventListener,
            false,
          );
          renderer.domElement.addEventListener(
            "webglcontextrestored",
            handleContextRestored,
            false,
          );
          window.addEventListener("resize", handleResize);
          document.addEventListener("visibilitychange", handleVisibilityChange);
          startRender();

          disposeScene = () => {
            stopRender();
            document.removeEventListener(
              "visibilitychange",
              handleVisibilityChange,
            );
            window.removeEventListener("resize", handleResize);
            renderer.domElement.removeEventListener(
              "webglcontextlost",
              handleContextLost as EventListener,
              false,
            );
            renderer.domElement.removeEventListener(
              "webglcontextrestored",
              handleContextRestored,
              false,
            );
            scene.remove(mesh);
            geometry.dispose();
            material.dispose();
            renderer.dispose();
            if (renderer.domElement.parentNode === container) {
              container.removeChild(renderer.domElement);
            }
          };
        } catch (error) {
          console.error("[LockScreen] WebGL background init failed", error);
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      disposeScene?.();
    };
  }, []);

  useEffect(() => {
    return () => {
      stopProgressLoop();
      if (unlockTimeoutRef.current !== null) {
        window.clearTimeout(unlockTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={[
        "lock-screen",
        "forest-lock-screen",
        isPressing ? "is-processing" : "",
        isUnlocked ? "is-unlocked" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-app-ready="true"
    >
      <div ref={webglContainerRef} className="webgl-container" aria-hidden="true" />
      <div className="flash-overlay" aria-hidden="true" />

      <main className="ui-layer">
        <header className="sys-bar">
          <div className="sys-left">
            <span className="sys-item">FOREST.AURA // 01</span>
            <span className="sys-item">ROOT.STABLE</span>
          </div>

          <div className="sys-right">
            <span className="sys-item">
              <SilentIcon />
              HUSH
            </span>
            <span className="sys-item">
              <WifiIcon />
              AETHER
            </span>
            <span className="sys-item">
              <BatteryIcon />
              GLOW
            </span>
          </div>
        </header>

        <section className="hero-container">
          <div className="time-wrapper">
            <div className="time-display">{display}</div>
            <div className="meridian">{meridian}</div>
          </div>

          <div className="date-composition">
            <span className="date-marker">{yearLabel}</span>
            <span className="divider" aria-hidden="true" />
            <span>{dateLabel}</span>
            <span className="divider" aria-hidden="true" />
            <span>{detailLabel}</span>
          </div>

          <div className="sub-quote">生生不息，万物寻路。</div>
        </section>

        <button
          type="button"
          className="interaction-zone"
          aria-label="长按以苏醒"
          onContextMenu={(event) => event.preventDefault()}
          onPointerDown={(event) => {
            if (event.pointerType === "mouse" && event.button !== 0) {
              return;
            }

            event.preventDefault();
            beginPress();
          }}
          onPointerLeave={(event) => {
            if (event.pointerType === "mouse") {
              releasePress();
            }
          }}
        >
          <div className="unlock-btn-container">
            <div className="unlock-ring-bg" />
            <canvas
              ref={progressCanvasRef}
              className="progress-canvas"
              width={PROGRESS_SIZE}
              height={PROGRESS_SIZE}
            />
            <div className="unlock-core" />
          </div>
          <div className="status-text">{statusText}</div>
        </button>

        <div className="decal-left">LAT. 35.8617° N // LNG. 104.1954° E</div>
        <div className="decal-right">ROOT.DEPTH.SIM // V 2.4.1</div>
      </main>
    </div>
  );
});

export default LockScreen;
