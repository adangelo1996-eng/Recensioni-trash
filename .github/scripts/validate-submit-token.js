#!/usr/bin/env node
"use strict";

const OWNER = "adangelo1996-eng";
const REPO = "Recensioni-trash";
const VALIDATION_EVENT = "token-validation";

async function main() {
  const token = process.env.SUBMIT_TOKEN || "";

  if (!token) {
    console.error("ERROR: SUBMIT_TOKEN secret is not set.");
    console.error("Add it in GitHub: Settings -> Secrets and variables -> Actions");
    process.exit(1);
  }

  const url = "https://api.github.com/repos/" + OWNER + "/" + REPO + "/dispatches";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      event_type: VALIDATION_EVENT,
      client_payload: { source: "deploy-pages validation probe" },
    }),
  });

  if (response.status === 204) {
    console.log("SUBMIT_TOKEN validation passed (repository_dispatch allowed).");
    return;
  }

  let message = "HTTP " + response.status;
  try {
    const body = await response.json();
    if (body.message) message = body.message;
  } catch (_) {
    /* ignore parse errors */
  }

  console.error("ERROR: SUBMIT_TOKEN cannot call repository_dispatch on " + OWNER + "/" + REPO + ".");
  console.error("GitHub API: " + message);
  console.error("");
  console.error("The deploy is blocked until SUBMIT_TOKEN has the correct permissions.");
  console.error("");
  console.error("RECOMMENDED — Classic Personal Access Token:");
  console.error("  GitHub -> Settings -> Developer settings -> Personal access tokens -> Tokens (classic)");
  console.error("  Generate new token (classic) with scope: public_repo  (repo if the repository is private)");
  console.error("");
  console.error("ALTERNATIVE — Fine-grained PAT (Recensioni-trash repository only):");
  console.error("  Contents: Read and write");
  console.error("  Metadata: Read");
  console.error("");
  console.error("Common mistake: Actions Read and write alone does NOT work for repository_dispatch.");
  console.error("");
  console.error("After updating the secret:");
  console.error("  1. Settings -> Secrets and variables -> Actions -> SUBMIT_TOKEN -> Update");
  console.error("  2. Actions -> Deploy GitHub Pages -> Run workflow");

  process.exit(1);
}

main().catch(function (err) {
  console.error("ERROR: Token validation request failed:", err.message);
  process.exit(1);
});
