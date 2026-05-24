#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const token = process.env.SUBMIT_TOKEN || "";

if (!token) {
  console.error("ERROR: SUBMIT_TOKEN secret is not set.");
  console.error("Add it in GitHub: Settings -> Secrets and variables -> Actions");
  console.error("Secret name: SUBMIT_TOKEN");
  console.error("Value: fine-grained PAT with Actions Read and write on Recensioni-trash");
  process.exit(1);
}

const content = [
  "window.CONFIG = {",
  "  owner: 'adangelo1996-eng',",
  "  repo: 'Recensioni-trash',",
  "  token: " + JSON.stringify(token) + ",",
  "};",
  "",
].join("\n");

const outPath = path.join(process.cwd(), "js", "config.js");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, content, "utf8");
console.log("Generated js/config.js");
