import http from 'node:http';
import { WebSocket } from 'ws';

const assertPort = port => {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Port must be 1024..65535');
};

export const requestJson = (port, requestPath) => new Promise((resolve, reject) => {
  assertPort(port);
  const request = http.get({ host: '127.0.0.1', port, path: requestPath, timeout: 2500 }, response => {
    let data = '';
    response.setEncoding('utf8');
    response.on('data', chunk => { data += chunk; });
    response.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(Error(`Invalid CDP JSON from ${requestPath}: ${error.message}`));
      }
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

export const isCodexTarget = target => target?.type === 'page' &&
  /^(app:|https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\/)/.test(target.url || '');

export const evaluateTarget = (target, expression) => new Promise((resolve, reject) => {
  if (!/^ws:\/\/127\.0\.0\.1(?::\d+)?\//.test(target?.webSocketDebuggerUrl || '')) {
    reject(Error('Refusing non-loopback target WebSocket'));
    return;
  }
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  let settled = false;
  const timeout = setTimeout(() => {
    socket.terminate();
    finish(Error('CDP evaluate timeout'));
  }, 5000);
  const finish = (error, value) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    socket.close();
    if (error) reject(error);
    else resolve(value);
  };
  socket.on('open', () => socket.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: { expression, returnByValue: true }
  })));
  socket.on('message', raw => {
    let message;
    try { message = JSON.parse(raw.toString('utf8')); }
    catch (error) { finish(error); return; }
    if (message.id !== 1) return;
    if (message.error) finish(Error(message.error.message || 'CDP evaluation failed'));
    else if (message.result?.exceptionDetails) {
      finish(Error(message.result.exceptionDetails.text || 'Renderer expression failed'));
    } else finish(null, message.result?.result?.value);
  });
  socket.on('error', error => finish(error));
});
