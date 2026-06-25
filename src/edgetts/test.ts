/**
 * EdgeTTS 连接测试工具
 */

export async function testEdgeTTSConnection(): Promise<void> {
  console.log('=== EdgeTTS 连接测试开始 ===');

  try {
    // 生成签名
    const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
    const WINDOWS_EPOCH_OFFSET = 11644473600;
    const SEC_MS_GEC_INTERVAL = 300;
    const FILE_TIME_TICK_MULTIPLIER = 10000000;

    const currentUnixTime = Math.floor(Date.now() / 1000);
    const windowsEpoch = currentUnixTime + WINDOWS_EPOCH_OFFSET;
    const roundedTime = Math.floor(windowsEpoch / SEC_MS_GEC_INTERVAL) * SEC_MS_GEC_INTERVAL;
    const fileTicks = roundedTime * FILE_TIME_TICK_MULTIPLIER;
    const message = fileTicks.toString() + TRUSTED_CLIENT_TOKEN;

    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const secMsGec = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    console.log('签名生成成功:', secMsGec);

    // 生成 UUID
    const connectionId = crypto.randomUUID().replace(/-/g, '');
    console.log('ConnectionId:', connectionId);

    // 构建 URL
    const params = new URLSearchParams({
      'TrustedClientToken': TRUSTED_CLIENT_TOKEN,
      'ConnectionId': connectionId,
      'Sec-MS-GEC': secMsGec,
      'Sec-MS-GEC-Version': '1-143.0.3650.75'
    });

    const url = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?${params.toString()}`;
    console.log('连接 URL:', url);

    // 尝试连接
    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';

    ws.addEventListener('open', () => {
      console.log('✅ WebSocket 连接成功！');
      ws.close();
    });

    ws.addEventListener('error', (e) => {
      console.error('❌ WebSocket 错误:', e);
    });

    ws.addEventListener('close', (e) => {
      console.log(`WebSocket 关闭: code=${e.code}, reason="${e.reason}"`);
    });

  } catch (error) {
    console.error('测试失败:', error);
  }
}
