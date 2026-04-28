import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root container #root was not found.");
}

// iOS Safari: prevent keyboard from scrolling the viewport
document.addEventListener("focusin", (e) => {
  const target = e.target as HTMLElement;
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
  }
});

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", () => {
    window.scrollTo(0, 0);
  });
  window.visualViewport.addEventListener("scroll", () => {
    window.scrollTo(0, 0);
  });
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

