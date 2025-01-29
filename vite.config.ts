import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    /**
     * fake https for local development so getUserMedia does not fail:
     * https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
     */
    mkcert(),
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
