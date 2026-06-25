/**
 * EdgeTTS HTTP 客户端（备用方案）
 * 使用 Obsidian 的 requestUrl API 而不是 WebSocket
 */

import { requestUrl } from 'obsidian';
import { SynthesisOptions } from './types';

export class EdgeTtsHttpClient {
  /**
   * 尝试使用 HTTP 方式合成语音
   * 注意：这是一个实验性的备用方案
   */
  async synthesize(text: string, options: SynthesisOptions): Promise<ArrayBuffer> {
    try {
      console.log('尝试使用 HTTP 方式访问 EdgeTTS...');

      // 尝试使用 Obsidian 的 requestUrl
      const response = await requestUrl({
        url: 'https://speech.platform.bing.com',
        method: 'GET'
      });

      console.log('HTTP 响应状态:', response.status);
      console.log('HTTP 响应:', response);

      throw new Error('EdgeTTS 不支持 HTTP 接口，需要使用 WebSocket');

    } catch (error) {
      console.error('HTTP 请求失败:', error);
      throw error;
    }
  }
}
