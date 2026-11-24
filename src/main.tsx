import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { isExtensionPopup } from "./utils/chrome";

if (isExtensionPopup) {
  document.documentElement.classList.add("tabby-popup");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
