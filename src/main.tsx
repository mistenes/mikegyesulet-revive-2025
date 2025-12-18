import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import "./styles/cookieconsent.css";

createRoot(document.getElementById("root")!).render(<App />);
