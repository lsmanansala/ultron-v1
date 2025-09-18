import fs from 'fs/promises';
import path from 'path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { connectDB } from "../api/utils/db.js";

const execAsync = promisify(exec);

const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'audit.log');
const MAX_LOG_SIZE = 5 * 1024 * 1024;
const RISK_LEVELS = {
  1: 'LOW',
  3: 'MEDIUM',
  5: 'CRITICAL'
};


async function initLogger() {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
    await fs.access(LOG_FILE).catch(() => fs.writeFile(LOG_FILE, ''));
  } catch (err) {
    console.error('Logger init failed:', err);
  }
}


async function rotateLogs() {
  try {
    const stats = await fs.stat(LOG_FILE);
    if (stats.size > MAX_LOG_SIZE) {
      const timestamp = new Date().toISOString()
        .replace(/[:.]/g, '-')
        .replace('T', '_');
      await fs.rename(LOG_FILE, path.join(LOG_DIR, `audit-${timestamp}.log`));
      await fs.writeFile(LOG_FILE, '');
    }
  } catch (err) {
    if (err.code !== 'ENOENT') { 
      console.error('Log rotation error:', err);
    }
  }
}

export async function logAction(user, action, riskLevel = 1) {
  try {
    await initLogger();
    await rotateLogs();

    const timestamp = new Date().toISOString();
    const riskLabel = RISK_LEVELS[riskLevel] || 'UNKNOWN';
    const entry = `[${timestamp}] [${user}] [${riskLabel}] ${action}\n`;

    // --- File logging ---
    await fs.appendFile(LOG_FILE, entry, { flag: 'a' });

    // --- MongoDB logging ---
    try {
      const db = await connectDB();
      await db.collection('logs').insertOne({
        timestamp,
        user,
        risk: riskLabel,
        action
      });
    } catch (dbErr) {
      console.error('MongoDB log insert failed:', dbErr.message);
    }

  } catch (err) {
    console.error('Log write failed:', err);
  }
}


export async function logToWindowsEvent(message, level = 'INFO') {
  if (process.platform !== 'win32') return;

  try {
    const levelMap = {
      INFO: 'INFORMATION',
      WARNING: 'WARNING',
      ERROR: 'ERROR',
      CRITICAL: 'ERROR' 
    };

    const eventType = levelMap[level] || 'INFORMATION';
    const safeMessage = String(message)
      .replace(/"/g, "'") 
      .substring(0, 1024); 

    await execAsync(
      `EventCreate /ID 1 /L APPLICATION /T ${eventType} /SO "Ultron" /D "${safeMessage}"`
    );
  } catch (err) {
    console.error('Windows Event Log failed:', err.message);
    await logAction('SYSTEM', `[WIN-EVENT-FALLBACK] ${level}: ${message}`, 3);
  }
}

export async function cleanOldLogs(maxDays = 30) {
  try {
    const files = await fs.readdir(LOG_DIR);
    const now = Date.now();
    const cutoff = now - (maxDays * 24 * 60 * 60 * 1000);

    for (const file of files) {
      if (file.startsWith('audit-') && file.endsWith('.log')) {
        const filePath = path.join(LOG_DIR, file);
        const stats = await fs.stat(filePath);
        if (stats.mtimeMs < cutoff) {
          await fs.unlink(filePath);
        }
      }
    }
  } catch (err) {
    console.error('Log cleanup failed:', err);
  }
}