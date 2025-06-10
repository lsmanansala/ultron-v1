export function sanitizeInput(input) {
  return input
    .replace(/[;&|<>$`]/g, '')
    .replace(/\b(rm|shutdown|format)\b/gi, '[REDACTED]');
}

export function isSafeCommand(input) {
  const blocked = [
    'cmd', 'powershell', 'format', 'del', 
    'regedit', 'shutdown'
  ];
  return !blocked.some(cmd => input.toLowerCase().includes(cmd));
}

export function sanitizeReply(reply) {
  return reply.replace('—', ', ')
}