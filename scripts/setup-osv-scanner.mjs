#!/usr/bin/env node

import { execSync } from "node:child_process";
import { platform } from "node:os";
import { exit } from "node:process";

const osvScannerVersion = "2.6.0";

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

function normalizeArchForOSV(arch) {
  if (arch === "x86_64") {
    return "amd64";
  }
  if (arch === "aarch64") {
    return "arm64";
  }
  return arch === "amd64" || arch === "arm64" ? arch : "amd64";
}

function installTool() {
  const os = getPlatform();
  const arch = normalizeArchForOSV(getArchitecture());
  const version = osvScannerVersion;

  if (platform() === "win32") {
    console.error("\nInstall osv-scanner via choco or scoop on Windows.\n");
    return false;
  }

  const downloadUrl =
    os === "macos"
      ? `https://github.com/google/osv-scanner/releases/download/v${version}/osv-scanner_darwin_${arch}`
      : `https://github.com/google/osv-scanner/releases/download/v${version}/osv-scanner_linux_${arch}`;

  const tempFile = "/tmp/osv-scanner";

  try {
    console.log(`\nInstalling osv-scanner ${version}...`);
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
    execSync(`chmod +x ${tempFile}`, { stdio: "ignore" });
    execSync(`sudo mv ${tempFile} /usr/local/bin/osv-scanner`, {
      stdio: "inherit",
    });
    return checkToolExists("osv-scanner", "osv-scanner --version");
  } catch (error) {
    console.error(`\nFailed to install osv-scanner: ${error.message}`);
    return false;
  }
}

function main() {
  console.log("\nSetting up osv-scanner...\n");

  if (checkToolExists("osv-scanner", "osv-scanner --version")) {
    console.log("osv-scanner is already installed.\n");
    exit(0);
  }

  if (!installTool()) {
    console.error("\nosv-scanner installation failed. Install manually.\n");
    exit(1);
  }

  console.log("\nosv-scanner setup complete.\n");
}

main();
