import AuthGate from "./components/AuthGate";

function App() {
  return (
    <div className="h-screen w-full overflow-hidden bg-[var(--canvas)] text-[var(--ink)] transition-colors duration-300">
      <AuthGate />
    </div>
  );
}

export default App;
