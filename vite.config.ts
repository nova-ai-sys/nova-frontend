import { createLogger, defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { readFileSync, existsSync } from 'fs'

const envDir = __dirname;

const manifestPath = path.resolve(__dirname, '.release-please-manifest.json');
let appVersion = '0.0.0';
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  appVersion = manifest['.'] ?? '0.0.0';
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, '');

  // Hosts allowed to reach the dev server through a reverse proxy / tunnel.
  // A leading dot allows the domain and all of its subdomains. Extra entries
  // can be added with VITE_ALLOWED_HOSTS (comma-separated).
  const allowedHosts = [
    '.robyn.es',
    '.trycloudflare.com',
    '.cfargotunnel.com',
    ...(env.VITE_ALLOWED_HOSTS ?? '')
      .split(',')
      .map((host) => host.trim())
      .filter(Boolean),
  ];

  // When served over an HTTPS tunnel the HMR client must use wss:// on port 443;
  // otherwise it tries ws://<tunnel-host>:5173 and never connects.
  const tunnelHost = env.VITE_TUNNEL_HOST?.trim();

  // Where the dev server forwards /api.
  //
  // 127.0.0.1 rather than localhost, deliberately: on Windows `localhost`
  // resolves to ::1 before 127.0.0.1, and uvicorn's `--host 0.0.0.0` binds
  // IPv4 only. The proxy then reports ECONNREFUSED for every request while the
  // API is running perfectly well. Naming the address removes the ambiguity.
  const apiTarget = env.VITE_API_PROXY_TARGET?.trim() || 'http://127.0.0.1:8000';

  // Vite logs its own stack trace for every proxied request that cannot reach
  // the API, which on a cold start is one per call the app makes on load. The
  // proxy's own handler below says the same thing once, in a sentence, so this
  // drops the duplicates. Any other proxy error still gets through.
  const logger = createLogger();
  const baseError = logger.error;
  logger.error = (msg, options) => {
    if (msg.includes('http proxy error') && msg.includes('ECONNREFUSED')) return;
    baseError(msg, options);
  };

  return {
    customLogger: logger,
    plugins: [react(), tailwindcss()],
    base: '/',
    envDir,
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: true,
      allowedHosts,
      ...(tunnelHost
        ? { hmr: { host: tunnelHost, protocol: 'wss', clientPort: 443 } }
        : {}),
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          configure(proxy) {
            // Starting the UI before the API is the normal way round, so a
            // backend that is not up yet should read as one line of guidance
            // rather than a socket stack trace per request the app makes on
            // load. The notice repeats only after a request has succeeded.
            let warned = false;

            proxy.on('error', (err, _req, res) => {
              const refused = 'code' in err && err.code === 'ECONNREFUSED';

              if (!refused) {
                console.log('  [api proxy] ' + err.message);
              } else if (!warned) {
                warned = true;
                console.log('');
                console.log('  NOVA API is not reachable at ' + apiTarget);
                console.log('  Start it with `make api` in the nova-api repo.');
                console.log('');
              }

              // Answer the browser instead of hanging up on it: the UI already
              // knows how to retry a failed fetch, but a dropped socket shows
              // up as an opaque network error.
              if (res && 'writeHead' in res && !res.headersSent) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ detail: 'NOVA API unreachable' }));
              }
            });

            proxy.on('proxyRes', () => {
              warned = false;
            });
          },
        },
      },
    },
    preview: {
      host: true,
      allowedHosts,
    },
  };
})
