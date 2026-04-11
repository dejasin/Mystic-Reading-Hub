import { Switch, Route, Router as WouterRouter } from "wouter";
import { lazy, Suspense } from "react";
import "./styles.css";

const HomePage = lazy(() => import("./pages/HomePage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0e1a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#c9a84c',
      fontFamily: 'Georgia, serif',
      fontSize: '1.2rem',
      letterSpacing: '0.1em'
    }}>
      ◈
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/support" component={SupportPage} />
        <Route component={HomePage} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
    </WouterRouter>
  );
}

export default App;
