#!/usr/bin/env node

import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { platform } from "node:os";
import path from "node:path";
import { exit } from "node:process";

const gitleaksVersion = "8.30.1";
const gitleaksChecksums = {
  "gitleaks_8.30.1_darwin_arm64.tar.gz":
    "b40ab0ae55c505963e365f271a8d3846efbc170aa17f2607f13df610a9aeb6a5",
  "gitleaks_8.30.1_darwin_x64.tar.gz":
    "dfe101a4db2255fc85120ac7f3d25e4342c3c20cf749f2c20a18081af1952709",
  "gitleaks_8.30.1_linux_arm64.tar.gz":
    "e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080",
  "gitleaks_8.30.1_linux_x64.tar.gz":
    "551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb",
};

function checkToolExists(toolName, checkCommand) {
  try {
    execSync(checkCommand, { stdio: "ignore" });
    return true;
  } catch {
    try {
      execSync(`which ${toolName}`, { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  }
}

function getPlatform() {
  const osPlatform = platform();
  if (osPlatform === "darwin") {
    return "macos";
  }
  if (osPlatform === "linux") {
    return "linux";
  }
  if (osPlatform === "win32") {
    return "win32";
  }
  return "linux";
}

function checkCurlAvailable() {
  try {
    execSync("which curl", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function getArchitecture() {
  try {
    return execSync("uname -m", { encoding: "utf-8" }).trim();
  } catch {
    return "x86_64";
  }
}

function normalizeArchForGitleaks(arch) {
  if (arch === "x86_64") {
    return "x64";
  }
  if (arch === "aarch64") {
    return "arm64";
  }
  return arch === "x64" || arch === "arm64" ? arch : "x64";
}

function verifyReleaseAsset({ filePath, fileName }) {
  const expected = gitleaksChecksums[fileName];
  if (!expected) {
    throw new Error(`no pinned checksum for ${fileName}`);
  }
  const digest = createHash("sha256")
    .update(readFileSync(filePath))
    .digest("hex");
  if (digest !== expected) {
    throw new Error(`checksum mismatch for ${fileName}`);
  }
}

function installTool() {
  const os = getPlatform();
  const arch = getArchitecture();
  const normalizedArch = normalizeArchForGitleaks(arch);
  const version = gitleaksVersion;

  if (os === "win32") {
    console.error("\ngitleaks is not installed.");
    console.error(
      "Install via: choco install gitleaks or scoop install gitleaks"
    );
    return false;
  }

  const downloadUrl =
    os === "macos"
      ? `https://github.com/gitleaks/gitleaks/releases/download/v${version}/gitleaks_${version}_darwin_${normalizedArch}.tar.gz`
      : `https://github.com/gitleaks/gitleaks/releases/download/v${version}/gitleaks_${version}_linux_${normalizedArch}.tar.gz`;

  const tempFile = `/tmp/gitleaks.tar.gz`;

  try {
    console.log(`\nInstalling gitleaks ${version}...`);
    let downloadCommand;
    try {
      execSync("which wget", { stdio: "ignore" });
      downloadCommand = `wget -O ${tempFile} "${downloadUrl}"`;
    } catch {
      if (!checkCurlAvailable()) {
        throw new Error("wget or curl is required");
      }
      downloadCommand = `curl -L -o ${tempFile} "${downloadUrl}"`;
    }
    execSync(downloadCommand, { stdio: "inherit" });
    verifyReleaseAsset({
      fileName: path.basename(downloadUrl),
      filePath: tempFile,
    });
    execSync(`tar -xzf ${tempFile} -C /tmp`, { stdio: "inherit" });
    execSync("sudo mv /tmp/gitleaks /usr/local/bin/", { stdio: "inherit" });
    return checkToolExists("gitleaks", "gitleaks version");
  } catch (error) {
    console.error(`\nFailed to install gitleaks: ${error.message}`);
    return false;
  }
}

function main() {
  console.log("\nSetting up gitleaks...\n");

  if (checkToolExists("gitleaks", "gitleaks version")) {
    console.log("gitleaks is already installed.\n");
    exit(0);
  }

  if (!installTool()) {
    console.error("\ngitleaks is required. Install manually and retry.\n");
    exit(1);
  }

  console.log("\ngitleaks setup complete.\n");
}

main();
