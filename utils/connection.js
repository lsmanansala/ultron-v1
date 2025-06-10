import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { OPEN_ROUTER_BASE_URL } from "../config.js";
const execAsync = promisify(exec);

export async function checkOpenRouterConnection() {
  try {
    const { stdout } = await execAsync(`ping ${OPEN_ROUTER_BASE_URL} -n 1`);
    return stdout.includes('TTL='); 
  } catch {
    return false;
  }
}

export async function checkInternetConnection() {
  try {
    const { stdout } = await execAsync('ping 8.8.8.8 -n 1');
    return stdout.includes('TTL=');
  } catch {
    return false;
  }
}

export async function checkPort(port = 11434) {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    return stdout.includes('LISTENING');
  } catch {
    return false;
  }
}

export async function verifyConnections() {
  const [internet, openRouter, localModel] = await Promise.all([
    checkInternetConnection(),
    checkOpenRouterConnection(),
    checkPort(11434) // Default port for Ollama
  ]);

  return {
    internet,
    openRouter,
    localModel,
    timestamp: new Date().toISOString()
  };
}