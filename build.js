const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

// Inline CSS for Shadcn/Tailwind theme
const globalCSS = `
:root {
  --background: 222 47% 11%;
  --foreground: 210 40% 98%;
  --card: 222 47% 14%;
  --card-foreground: 210 40% 98%;
  --primary: 199 89% 48%;
  --primary-foreground: 222 47% 11%;
  --secondary: 217 33% 17%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --accent: 217 33% 17%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62% 55%;
  --destructive-foreground: 210 40% 98%;
  --border: 217 33% 25%;
  --input: 217 33% 25%;
  --ring: 199 89% 48%;
  --radius: 0.5rem;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

.bg-background { background: hsl(var(--background)); }
.bg-card { background: hsl(var(--card)); }
.bg-primary { background: hsl(var(--primary)); }
.bg-secondary { background: hsl(var(--secondary)); }
.bg-destructive { background: hsl(var(--destructive)); }
.bg-muted { background: hsl(var(--muted)); }
.bg-accent { background: hsl(var(--accent)); }

.text-foreground { color: hsl(var(--foreground)); }
.text-card-foreground { color: hsl(var(--card-foreground)); }
.text-primary { color: hsl(var(--primary)); }
.text-primary-foreground { color: hsl(var(--primary-foreground)); }
.text-secondary-foreground { color: hsl(var(--secondary-foreground)); }
.text-muted-foreground { color: hsl(var(--muted-foreground)); }
.text-destructive { color: hsl(var(--destructive)); }

.border-border { border-color: hsl(var(--border)); }
.border-input { border-color: hsl(var(--input)); }
.border-primary { border-color: hsl(var(--primary)); }

.ring-ring { --tw-ring-color: hsl(var(--ring)); }

.rounded-lg { border-radius: var(--radius); }
.rounded-md { border-radius: calc(var(--radius) - 2px); }
.rounded-sm { border-radius: calc(var(--radius) - 4px); }

/* Utility classes */
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }
.hidden { display: none; }

.flex-col { flex-direction: column; }
.flex-1 { flex: 1; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }

.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }

.p-2 { padding: 0.5rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.p-8 { padding: 2rem; }

.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }

.pt-0 { padding-top: 0; }
.pb-3 { padding-bottom: 0.75rem; }
.ml-2 { margin-left: 0.5rem; }
.mt-2 { margin-top: 0.5rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }

.space-y-2 > * + * { margin-top: 0.5rem; }
.space-y-4 > * + * { margin-top: 1rem; }
.space-y-6 > * + * { margin-top: 1.5rem; }

.w-full { width: 100%; }
.w-5 { width: 1.25rem; }
.w-4 { width: 1rem; }
.w-3 { width: 0.75rem; }
.h-10 { height: 2.5rem; }
.h-9 { height: 2.25rem; }
.h-5 { height: 1.25rem; }
.h-4 { height: 1rem; }
.h-3 { height: 0.75rem; }
.max-w-\\[140px\\] { max-width: 140px; }
.max-w-2xl { max-width: 42rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.min-h-screen { min-height: 100vh; }

.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-center { text-align: center; }

.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.uppercase { text-transform: uppercase; }
.tracking-tight { letter-spacing: -0.025em; }
.leading-none { line-height: 1; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.border { border-width: 1px; }
.border-0 { border-width: 0; }
.shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.shadow-none { box-shadow: none; }

.cursor-pointer { cursor: pointer; }
.pointer-events-none { pointer-events: none; }

.opacity-50 { opacity: 0.5; }
.transition-colors { transition: color 0.15s, background-color 0.15s, border-color 0.15s; }
.transition-all { transition: all 0.2s; }

.hover\\:bg-primary\\/90:hover { background: hsl(199 89% 48% / 0.9); }
.hover\\:bg-secondary\\/80:hover { background: hsl(217 33% 17% / 0.8); }
.hover\\:bg-accent:hover { background: hsl(var(--accent)); }

.disabled\\:opacity-50:disabled { opacity: 0.5; }
.disabled\\:pointer-events-none:disabled { pointer-events: none; }

.focus-visible\\:outline-none:focus-visible { outline: none; }
.focus-visible\\:ring-2:focus-visible { box-shadow: 0 0 0 2px hsl(var(--ring)); }

.appearance-none { appearance: none; }
.relative { position: relative; }
.absolute { position: absolute; }
.right-3 { right: 0.75rem; }
.top-3 { top: 0.75rem; }

/* Badge variants */
.badge { display: inline-flex; align-items: center; border-radius: 9999px; border: 1px solid transparent; padding: 0.125rem 0.625rem; font-size: 0.75rem; font-weight: 600; }
.badge-success { background: #22c55e; color: white; }
.badge-warning { background: #eab308; color: black; }
.badge-destructive { background: hsl(var(--destructive)); color: white; }

/* Animations */
@keyframes spin { to { transform: rotate(360deg); } }
.animate-spin { animation: spin 0.8s linear infinite; }

/* Gradient */
.bg-gradient-to-r { background: linear-gradient(to right, var(--tw-gradient-stops)); }
.from-primary { --tw-gradient-from: hsl(var(--primary)); --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to); }
.to-cyan-400 { --tw-gradient-to: #22d3ee; }
.bg-clip-text { background-clip: text; -webkit-background-clip: text; }
.text-transparent { color: transparent; }

/* Select dropdown styling */
select {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}
select option {
  background: hsl(var(--card));
  color: hsl(var(--foreground));
}
`;

async function build() {
  console.log(isWatch ? '👀 Watching for changes...' : '🔨 Building extension...');

  // Ensure directories
  ['dist', 'dist/icons'].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const commonOptions = {
    bundle: true,
    minify: !isWatch,
    sourcemap: isWatch,
    target: ['chrome100'],
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
    define: { 'process.env.NODE_ENV': isWatch ? '"development"' : '"production"' },
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  };

  try {
    // Build popup
    await esbuild.build({
      ...commonOptions,
      entryPoints: ['src/popup/Popup.tsx'],
      outfile: 'dist/popup.js',
      external: [],
    });
    console.log('✓ popup.js');

    // Build options
    await esbuild.build({
      ...commonOptions,
      entryPoints: ['src/options/Options.tsx'],
      outfile: 'dist/options.js',
    });
    console.log('✓ options.js');

    // Build content script
    await esbuild.build({
      ...commonOptions,
      entryPoints: ['src/content/content.tsx'],
      outfile: 'dist/content.js',
    });
    console.log('✓ content.js');

    // Build background script
    await esbuild.build({
      ...commonOptions,
      entryPoints: ['src/background/background.ts'],
      outfile: 'dist/background.js',
    });
    console.log('✓ background.js');

    // Write CSS
    fs.writeFileSync('dist/styles.css', globalCSS);
    console.log('✓ styles.css');

    // Write HTML files
    fs.writeFileSync('dist/popup.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="styles.css">
  <style>body { width: 320px; min-height: 200px; }</style>
</head>
<body>
  <div id="root"></div>
  <script src="popup.js"></script>
</body>
</html>`);

    fs.writeFileSync('dist/options.html', `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="root"></div>
  <script src="options.js"></script>
</body>
</html>`);
    console.log('✓ HTML files');

    // Copy manifest
    fs.copyFileSync('src/manifest.json', 'dist/manifest.json');
    console.log('✓ manifest.json');

    // Copy icons
    for (const size of [16, 32, 48, 128]) {
      const src = `assets/icon${size}.png`;
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, `dist/icons/icon${size}.png`);
      }
    }
    console.log('✓ icons');

    console.log('\n✅ Build complete! Load dist/ folder in chrome://extensions');

  } catch (err) {
    console.error('❌ Build failed:', err);
    process.exit(1);
  }
}

build();
