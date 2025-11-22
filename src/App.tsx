import AuthGate from "./components/AuthGate";

function App() {
  return (
    <div className="h-screen w-full bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flow-root">
      <AuthGate />
    </div>
  );
}

export default App;
