const { execSync } = require("node:child_process");

let raw = "";
process.stdin.on("data", (chunk) => {
  raw += chunk;
});
process.stdin.on("end", () => {
  let filePath = "";
  try {
    const input = JSON.parse(raw);
    filePath = input.tool_input && input.tool_input.file_path ? input.tool_input.file_path : "";
  } catch {
    process.exit(0);
  }

  if (!/\.(ts|tsx)$/.test(filePath)) {
    process.exit(0);
  }

  try {
    execSync("npx tsc --noEmit", { stdio: "inherit", cwd: __dirname + "/../.." });
    console.log(`tsc --noEmit OK (déclenché par ${filePath})`);
  } catch {
    console.error(`tsc --noEmit a trouvé des erreurs de type (déclenché par ${filePath})`);
  }
});
