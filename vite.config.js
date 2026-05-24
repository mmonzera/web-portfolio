import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const vercelApiMock = () => {
  return {
    name: 'vercel-api-mock',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url.startsWith('/api/')) {
          const endpoint = req.url.split('?')[0].replace('/api/', '');
          const filePath = path.resolve(process.cwd(), `api/${endpoint}.js`);
          
          if (fs.existsSync(filePath)) {
            // Read body
            let body = ''
            req.on('data', chunk => { body += chunk.toString() })
            req.on('end', async () => {
              try {
                if (body) req.body = JSON.parse(body);
              } catch (e) {
                req.body = {};
              }

              // Mock Vercel res methods
              res.status = (code) => {
                res.statusCode = code;
                return res;
              };
              res.json = (data) => {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              };

              try {
                // Dynamically import the handler
                const module = await import(`file://${filePath}?update=${Date.now()}`);
                await module.default(req, res);
              } catch (err) {
                console.error('API Error:', err);
                res.status(500).json({ error: err.message });
              }
            });
            return; // Stop the middleware chain
          }
        }
        next();
      });
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vercelApiMock()],
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/framer-motion')) return 'motion-vendor';
          if (id.includes('node_modules/react-markdown') || id.includes('node_modules/remark') || id.includes('node_modules/rehype') || id.includes('node_modules/unified') || id.includes('node_modules/micromark') || id.includes('node_modules/mdast') || id.includes('node_modules/hast')) return 'markdown-vendor';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'react-vendor';
        },
      },
    },
  },
})
