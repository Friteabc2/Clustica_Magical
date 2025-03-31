import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialisation du thème le plus tôt possible pour éviter les flashs
(function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark-theme');
    document.body.classList.add('dark-theme');
  } else {
    document.documentElement.classList.remove('dark-theme');
    document.body.classList.remove('dark-theme');
  }
})();

createRoot(document.getElementById("root")!).render(<App />);
