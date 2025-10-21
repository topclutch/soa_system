import { defineConfig, loadEnv } from "vite";
import react from '@vitejs/plugin-react'
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import tailwind from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      host: true,
      port: 5173,
      proxy: {
        "/pexels": {
          target: "https://images.pexels.com",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/pexels/, ""),
        },
        // Proxy para Backend 1 (Node.js - autenticación)
        "/api/auth": {
          target: "http://localhost:3001", // Backend 1
          changeOrigin: true,  
          secure: false,
          rewrite: (p) => p.replace(/^\/api\/auth/, "/api/auth"),
        },
        // Proxy para Backend 2 (Python/Flask - productos)
        "/api/products": {
          target: "http://localhost:5000", // Backend 2
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/api\/products/, "/api/products"),
        },
      },
    },
    plugins: [
      tailwind(),
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "mask-icon.svg",
          "icon-192.png",
          "icon-512.png",
        ],
        manifest: {
          name: "SOA E-Commerce App",
          short_name: "SOA Store",
          description: "Modern e-commerce app with dual API integration",
          theme_color: "#2563eb",
          background_color: "#ffffff",
          display: "standalone",
          icons: [
            {
              src: "icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "icon-512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "apple-touch-icon.png",
              sizes: "180x180",
              type: "image/png",
            },
            {
              src: "mask-icon.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "maskable",
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: "module",
          navigateFallback: "index.html",
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
          globIgnores: ["**/api/**"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [
            /^\/api\/auth\/.*$/, // Excluye rutas de autenticación
            /^\/api\/products\/.*$/, // Excluye rutas de productos
          ],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith("/api/auth"),
              handler: "NetworkOnly",
              options: {
                fetchOptions: {
                  credentials: "include", // Asegura envío de cookies
                }
              }
            },
            {
              urlPattern: ({ url }) => url.pathname.startsWith("/api/products"),
              handler: "NetworkFirst",
              options: {
                cacheName: "products-cache",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 300,
                },
                fetchOptions: {
                  credentials: "include", // Asegura envío de cookies
                }
              }
            },
            {
              urlPattern: ({ url, request }) => 
                (url.pathname.startsWith("/api/auth") || 
                 url.pathname.startsWith("/api/products")) &&
                ["POST", "PUT", "DELETE"].includes(request.method),
              handler: "NetworkOnly",
              options: {
                fetchOptions: {
                  credentials: "include", // Asegura envío de cookies
                }
              }
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "process.env": JSON.stringify(env),
    },
  };
});