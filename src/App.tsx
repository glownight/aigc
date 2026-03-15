import {
  Suspense,
  lazy,
  startTransition,
  useCallback,
  useState,
} from "react";
import LockScreen from "./components/LockScreen";

const loadWorkspaceApp = () => import("./WorkspaceApp");
const WorkspaceApp = lazy(loadWorkspaceApp);

function WorkspaceFallback() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background:
          "radial-gradient(circle at top, rgba(54, 61, 50, 0.22), transparent 42%), linear-gradient(180deg, #0a0b0a 0%, #1c1d1a 100%)",
      }}
    />
  );
}

function App() {
  const [isLocked, setIsLocked] = useState(() => {
    const unlockToken = sessionStorage.getItem("unlockToken");
    return !unlockToken;
  });

  const preloadWorkspace = useCallback(() => {
    void loadWorkspaceApp();
  }, []);

  const handleUnlock = useCallback(() => {
    startTransition(() => {
      setIsLocked(false);
    });
  }, []);

  const handleLock = useCallback(() => {
    sessionStorage.removeItem("unlockToken");
    startTransition(() => {
      setIsLocked(true);
    });
  }, []);

  if (isLocked) {
    return (
      <LockScreen
        onUnlock={handleUnlock}
        onPrepareUnlock={preloadWorkspace}
      />
    );
  }

  return (
    <Suspense fallback={<WorkspaceFallback />}>
      <WorkspaceApp onLock={handleLock} />
    </Suspense>
  );
}

export default App;
