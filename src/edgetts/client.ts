/**
 * EdgeTTS WebSocket 客户端
 */

import { SynthesisOptions } from './types';
import { generateSecMsGec, buildSSML, formatEdgeTimestamp, generateUUID, parseAudioFrame } from './utils';

const EDGE_TTS_URL = 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1';
const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const CONNECTION_TIMEOUT = 30000; // 30 秒连接超时
const MESSAGE_TIMEOUT = 120000;   // 120 秒消息超时

export class EdgeTtsClient {
  private ws: WebSocket | null = null;
  private audioChunks: ArrayBuffer[] = [];
  private resolve: ((value: ArrayBuffer) => void) | null = null;
  private reject: ((reason: Error) => void) | null = null;
  private connectionTimeout: number | null = null;
  private messageTimeout: number | null = null;

  /**
   * 合成语音
   * @param text 要合成的文本
   * @param options 合成选项
   * @returns MP3 音频数据
   */
  async synthesize(text: string, options: SynthesisOptions): Promise<ArrayBuffer> {
    this.audioChunks = [];

    try {
      // 生成连接 URL
      const url = await this.generateConnectionUrl();
      console.log('EdgeTTS connecting to:', url.substring(0, 100) + '...');

      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;

        // 创建 WebSocket 连接
        this.ws = new WebSocket(url);
        this.ws.binaryType = 'arraybuffer';

        // 设置连接超时
        this.connectionTimeout = window.setTimeout(() => {
          this.handleError(new Error('连接超时'));
        }, CONNECTION_TIMEOUT);

        // 监听连接打开
        this.ws.addEventListener('open', () => {
          this.clearConnectionTimeout();
          this.onOpen(text, options);
        });

        // 监听消息
        this.ws.addEventListener('message', (event: MessageEvent) => {
          this.onMessage(event);
        });

        // 监听错误
        this.ws.addEventListener('error', (event: Event) => {
          console.error('WebSocket error event:', event);
          this.handleError(new Error('WebSocket 连接失败'));
        });

        // 监听关闭
        this.ws.addEventListener('close', (event: CloseEvent) => {
          console.log('WebSocket closed:', event.code, event.reason);
          if (event.code !== 1000 && this.reject) {
            this.handleError(new Error(`WebSocket 关闭: ${event.code} ${event.reason || '未知原因'}`));
          }
          this.cleanup();
        });
      });

    } catch (error) {
      if (this.reject) {
        this.reject(error as Error);
      }
      throw error;
    }
  }

  /**
   * 生成连接 URL
   */
  private async generateConnectionUrl(): Promise<string> {
    const connectionId = generateUUID();
    const secMsGec = await generateSecMsGec();

    console.log('生成连接参数:');
    console.log('  ConnectionId:', connectionId);
    console.log('  Sec-MS-GEC:', secMsGec);

    const params = new URLSearchParams({
      'TrustedClientToken': TRUSTED_CLIENT_TOKEN,
      'ConnectionId': connectionId,
      'Sec-MS-GEC': secMsGec,
      'Sec-MS-GEC-Version': '1-143.0.3650.75'
    });

    return `${EDGE_TTS_URL}?${params.toString()}`;
  }

  /**
   * 连接打开处理
   */
  private onOpen(text: string, options: SynthesisOptions): void {
    if (!this.ws) return;

    console.log('WebSocket connected, sending messages...');

    try {
      // 1. 发送配置帧
      this.sendConfigMessage();

      // 2. 发送 SSML 请求
      this.sendSSMLMessage(text, options);

      // 设置消息超时
      this.messageTimeout = window.setTimeout(() => {
        this.handleError(new Error('消息接收超时'));
      }, MESSAGE_TIMEOUT);

    } catch (error) {
      console.error('Error in onOpen:', error);
      this.handleError(error as Error);
    }
  }

  /**
   * 发送配置消息
   */
  private sendConfigMessage(): void {
    if (!this.ws) return;

    const timestamp = formatEdgeTimestamp();
    const configJson = JSON.stringify({
      context: {
        synthesis: {
          audio: {
            metadataoptions: {
              sentenceBoundaryEnabled: 'false',
              wordBoundaryEnabled: 'false'
            },
            outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
          }
        }
      }
    });

    const message = `X-Timestamp:${timestamp}\r\n` +
      `Content-Type:application/json; charset=utf-8\r\n` +
      `Path:speech.config\r\n\r\n` +
      configJson;

    this.ws.send(message);
  }

  /**
   * 发送 SSML 消息
   */
  private sendSSMLMessage(text: string, options: SynthesisOptions): void {
    if (!this.ws) return;

    const requestId = generateUUID();
    const timestamp = formatEdgeTimestamp();
    const ssml = buildSSML(text, options);

    const message = `X-RequestId:${requestId}\r\n` +
      `Content-Type:application/ssml+xml\r\n` +
      `X-Timestamp:${timestamp}Z\r\n` +
      `Path:ssml\r\n\r\n` +
      ssml;

    this.ws.send(message);
  }

  /**
   * 处理 WebSocket 消息
   */
  private onMessage(event: MessageEvent): void {
    // 区分文本消息和二进制消息
    if (typeof event.data === 'string') {
      this.handleTextMessage(event.data);
    } else if (event.data instanceof ArrayBuffer) {
      this.handleBinaryMessage(event.data);
    }
  }

  /**
   * 处理文本消息
   */
  private handleTextMessage(message: string): void {
    console.log('Received text message:', message.substring(0, 100));
    // 检查是否为结束信号
    if (message.includes('Path:turn.end')) {
      console.log('Received turn.end signal');
      this.onComplete();
    }
  }

  /**
   * 处理二进制消息（音频帧）
   */
  private handleBinaryMessage(buffer: ArrayBuffer): void {
    console.log('Received binary message, size:', buffer.byteLength);
    const audioData = parseAudioFrame(buffer);
    if (audioData && audioData.byteLength > 0) {
      console.log('Extracted audio chunk, size:', audioData.byteLength);
      this.audioChunks.push(audioData);
    }
  }

  /**
   * 合成完成处理
   */
  private onComplete(): void {
    this.clearMessageTimeout();

    if (this.audioChunks.length === 0) {
      this.handleError(new Error('未收到音频数据'));
      return;
    }

    // 拼接所有音频帧
    const totalLength = this.audioChunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const mergedAudio = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of this.audioChunks) {
      mergedAudio.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    // 返回结果
    if (this.resolve) {
      this.resolve(mergedAudio.buffer);
      this.resolve = null;
      this.reject = null;
    }

    this.disconnect();
  }

  /**
   * 错误处理
   */
  private handleError(error: Error): void {
    this.clearConnectionTimeout();
    this.clearMessageTimeout();

    if (this.reject) {
      this.reject(error);
      this.resolve = null;
      this.reject = null;
    }

    this.disconnect();
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.cleanup();
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    this.clearConnectionTimeout();
    this.clearMessageTimeout();
    this.audioChunks = [];
  }

  /**
   * 清除连接超时
   */
  private clearConnectionTimeout(): void {
    if (this.connectionTimeout !== null) {
      window.clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  /**
   * 清除消息超时
   */
  private clearMessageTimeout(): void {
    if (this.messageTimeout !== null) {
      window.clearTimeout(this.messageTimeout);
      this.messageTimeout = null;
    }
  }
}
