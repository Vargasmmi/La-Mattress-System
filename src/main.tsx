import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { errorInterceptor } from "./utils/errorInterceptor";
import { logger } from "./utils/logger";

// Inicializar sistema de manejo de errores
errorInterceptor.init();
logger.info('Application starting', { timestamp: new Date().toISOString() }, 'App');

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);