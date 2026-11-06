// Writes preview/dist/abondhu-preview.html: one self-contained page for sharing as a preview.
import { readFileSync, writeFileSync } from "node:fs";
const css = readFileSync("preview/dist/app.css", "utf8");
const js = readFileSync("preview/dist/app.js", "utf8").replace(/<\/script/g, "<\\/script");
const html = `<title>Abondhu Assam</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,300;1,400&family=Geist+Mono:wght@400;500&display=swap">
<style>${css}</style>
<div id="root"></div>
<script>${js}</script>
`;
writeFileSync("preview/dist/abondhu-preview.html", html);
console.log("bytes", html.length);
