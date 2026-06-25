/**
 * EdgeTTS 工具函数
 */

import { SynthesisOptions } from './types';

// EdgeTTS 常量
const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WINDOWS_EPOCH_OFFSET = 11644473600;  // 1601→1970 秒数
const SEC_MS_GEC_INTERVAL = 300;            // 5 分钟
const FILE_TIME_TICK_MULTIPLIER = 10000000; // Windows FileTime 单位

/**
 * 生成 Sec-MS-GEC 签名
 * 防盗刷签名，有效期 5 分钟
 */
export async function generateSecMsGec(): Promise<string> {
  try {
    // 1. 获取当前 Unix 时间戳（秒）
    const currentUnixTime = Math.floor(Date.now() / 1000);

    // 2. 加上 Windows 纪元偏移，向下取整到最近的 5 分钟边界
    const windowsEpoch = currentUnixTime + WINDOWS_EPOCH_OFFSET;
    const roundedTime = Math.floor(windowsEpoch / SEC_MS_GEC_INTERVAL) * SEC_MS_GEC_INTERVAL;

    // 3. 转换为 Windows FileTime（100 纳秒单位）
    const fileTicks = roundedTime * FILE_TIME_TICK_MULTIPLIER;

    // 4. SHA256(fileTicks + token) → 十六进制大写
    const message = fileTicks.toString() + TRUSTED_CLIENT_TOKEN;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    // 检查 crypto.subtle 是否可用
    if (!crypto || !crypto.subtle) {
      throw new Error('crypto.subtle 不可用');
    }

    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex.toUpperCase();
  } catch (error) {
    console.error('生成签名失败:', error);
    throw error;
  }
}

/**
 * XML 特殊字符转义
 */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * 构建 SSML 字符串
 */
export function buildSSML(text: string, options: SynthesisOptions): string {
  const escapedText = escapeXml(text);
  // 确保使用有效的音色名称，如果为空则使用默认值
  const voice = options.voice || 'zh-CN-XiaoxiaoNeural';
  const rate = options.rate >= 0 ? `+${options.rate}%` : `${options.rate}%`;
  const pitch = options.pitch !== undefined ?
    (options.pitch >= 0 ? `+${options.pitch}Hz` : `${options.pitch}Hz`) : '+0Hz';
  const volume = options.volume !== undefined ?
    (options.volume >= 0 ? `+${options.volume}%` : `${options.volume}%`) : '+0%';

  return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='zh-CN'>
  <voice name='${voice}'>
    <prosody pitch='${pitch}' rate='${rate}' volume='${volume}'>${escapedText}</prosody>
  </voice>
</speak>`;
}

/**
 * 格式化时间戳为 Edge 格式
 * 示例: "Wed Jun 25 2026 08:30:00 GMT+0000 (Coordinated Universal Time)"
 */
export function formatEdgeTimestamp(): string {
  return new Date().toUTCString().replace(/GMT/, 'GMT+0000 (Coordinated Universal Time)');
}

/**
 * 生成无连字符的 UUID
 */
export function generateUUID(): string {
  // 检查 crypto.randomUUID 是否可用
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '');
  }

  // 降级方案：手动生成 UUID
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 解析二进制音频帧
 * 帧结构：
 * [0-1]:   Header 长度（2 字节，big-endian）
 * [2-N]:   Header 文本（UTF-8）
 * [N+1-*]: MP3 音频数据
 */
export function parseAudioFrame(buffer: ArrayBuffer): ArrayBuffer | null {
  const dataView = new DataView(buffer);

  // 读取前 2 字节作为 Header 长度
  const headerLength = dataView.getUint16(0, false); // big-endian

  // 读取 Header 文本
  const headerBytes = new Uint8Array(buffer, 2, headerLength);
  const headerText = new TextDecoder().decode(headerBytes);

  // 检查是否为音频帧
  if (!headerText.includes('Path:audio') || !headerText.includes('Content-Type:audio/mpeg')) {
    return null;
  }

  // 提取 MP3 数据
  const audioDataOffset = 2 + headerLength;
  const audioData = buffer.slice(audioDataOffset);

  return audioData;
}
