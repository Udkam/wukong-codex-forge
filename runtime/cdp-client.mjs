import http from 'node:http';
import { WebSocket } from 'ws';

const assertPort = port => {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Port must be 1024..65535');
};

export const requestJson = (port, requestPath) => new Promise((resolve, reject) => {
  assertPort(port);
  const request = http.get({ host: '127.0.0.1', port, path: requestPath, timeout: 2400 }, response => {
    let data = '';
    response.setEncoding('utf8');
    response.on('data', chunk => { data += chunk; });
    response.on('end', () => {
      try { resolve(JSON.parse(data)); }
      catch (error) { reject(Error(`Invalid CDP JSON from ${requestPath}: ${error.message}`)); }
    });
  });
  request.on('error', reject);
  request.on('timeout', () => request.destroy(Error('CDP timeout')));
});

export async function getBrowserVersion(port) {
  const version = await requestJson(port, '/json/version');
  if (!/^ws:\/\/127\.0\.0\.1(?::\d+)?\//.test(version.webSocketDebuggerUrl || '')) {
    throw Error('Refusing non-loopback CDP endpoint');
  }
  return version;
}

export const getTargets = port => requestJson(port, '/json/list');

export const isCodexTarget = target => target?.type === 'page' && (
  /^app:\/\/codex\//.test(target.url || '') ||
  /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\//.test(target.url || '')
);

export const commandTarget = (target, method, params = {}) => new Promise((resolve, reject) => {
  if (!/^ws:\/\/127\.0\.0\.1(?::\d+)?\//.test(target?.webSocketDebuggerUrl || '')) {
    reject(Error('Refusing non-loopback target WebSocket'));
    return;
  }
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  let settled = false;
  const timeout = setTimeout(() => {
    socket.terminate();
    finish(Error('CDP command timeout'));
  }, 8000);
  const finish = (error, value) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    socket.close();
    if (error) reject(error);
    else resolve(value);
  };
  socket.on('open', () => socket.send(JSON.stringify({ id: 1, method, params })));
  socket.on('message', raw => {
    let message;
    try { message = JSON.parse(raw.toString('utf8')); }
    catch (error) { finish(error); return; }
    if (message.id !== 1) return;
    if (message.error) finish(Error(message.error.message || 'CDP command failed'));
    else finish(null, message.result);
  });
  socket.on('error', error => finish(error));
});

export async function evaluateTarget(target, expression) {
  const response = await commandTarget(target, 'Runtime.evaluate', { expression, returnByValue: true });
  if (response?.exceptionDetails) throw Error(response.exceptionDetails.text || 'Renderer expression failed');
  return response?.result?.value;
}
