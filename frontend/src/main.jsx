import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { SimulatorProvider } from "./context/SimulatorContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <SimulatorProvider>
        <App />
      </SimulatorProvider>
    </ThemeProvider>
  </React.StrictMode>
);
