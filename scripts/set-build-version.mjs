import { readFile, writeFile } from "node:fs/promises";

const runNumber = Number(process.env.GITHUB_RUN_NUMBER);
const runAttempt = Number(process.env.GITHUB_RUN_ATTEMPT);

if (!Number.isInteger(runNumber) || runNumber < 1 || !Number.isInteger(runAttempt) || runAttempt < 1) {
  throw new Error("GitHub Actions run number and attempt are required to generate the release version.");
}

// Each normal run increments the minor version; retries get a higher patch version.
const version = `0.${runNumber + 1}.${runAttempt}`;

async function updateJson(path, update) {
  const value = JSON.parse(await readFile(path, "utf8"));
  update(value);
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

await updateJson("package.json", (value) => { value.version = version; });
await updateJson("package-lock.json", (value) => {
  value.version = version;
  value.packages[""].version = version;
});
await updateJson("src-tauri/tauri.conf.json", (value) => { value.version = version; });

const cargoToml = await readFile("src-tauri/Cargo.toml", "utf8");
await writeFile("src-tauri/Cargo.toml", cargoToml.replace(/^(version\s*=\s*)"[^"]+"/m, `$1"${version}"`));

const cargoLock = await readFile("src-tauri/Cargo.lock", "utf8");
const packageEntry = /(\[\[package\]\]\nname = "atlas-storyboard"\nversion = ")[^"]+(\")/;
if (!packageEntry.test(cargoLock)) throw new Error("Could not find atlas-storyboard in Cargo.lock.");
await writeFile("src-tauri/Cargo.lock", cargoLock.replace(packageEntry, `$1${version}$2`));

console.log(`Building Atlas ${version}`);
