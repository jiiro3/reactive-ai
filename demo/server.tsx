import { serve } from "bun";
import React from "react";
import { renderToString } from "react-dom/server";

const App = () => {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Reactive AI SDK Demo</title>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <link rel="stylesheet" href="/app.css" />
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel" src="/app.js"></script>
      </body>
    </html>
  );
};

serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    
    if (url.pathname === "/") {
      const html = renderToString(<App />);
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }
    
    if (url.pathname === "/app.js") {
      // Inject environment variables into the client code
      let clientCode = await Bun.file("./src/client.jsx").text();
      clientCode = clientCode.replace(
        "process.env.GEMINI_API_KEY",
        `'${process.env.GEMINI_API_KEY || ''}'`
      );
      return new Response(clientCode, {
        headers: { "Content-Type": "text/javascript" },
      });
    }
    
    if (url.pathname === "/app.css") {
      return new Response(await Bun.file("./src/app.css").text(), {
        headers: { "Content-Type": "text/css" },
      });
    }
    
    // Serve the SDK packages
    if (url.pathname.startsWith("/@reactive-ai/")) {
      const packagePath = url.pathname.replace("/@reactive-ai/", "../packages/");
      try {
        const file = await Bun.file(packagePath).text();
        return new Response(file, {
          headers: { "Content-Type": "application/javascript" },
        });
      } catch (e) {
        return new Response("Not Found", { status: 404 });
      }
    }
    
    return new Response("Not Found", { status: 404 });
  },
});

console.log("Demo running at http://localhost:3000");