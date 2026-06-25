/**
 * EdgeTTS 语音列表获取
 */

import { EdgeVoice } from './types';
import { requestUrl } from 'obsidian';

const VOICE_LIST_URL = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=6A5AA1D4EAFF4E9FB37E23D68491D6F4';

/**
 * 从 Bing API 获取语音列表
 */
export async function fetchVoiceList(): Promise<EdgeVoice[]> {
  try {
    const response = await requestUrl({
      url: VOICE_LIST_URL,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.status === 200) {
      return response.json as EdgeVoice[];
    } else {
      throw new Error(`获取语音列表失败: ${response.status}`);
    }
  } catch (error) {
    console.error('获取语音列表失败:', error);
    throw error;
  }
}

/**
 * 筛选中文语音
 */
export function filterChineseVoices(voices: EdgeVoice[]): EdgeVoice[] {
  return voices.filter(voice =>
    voice.Locale.startsWith('zh-')
  );
}

/**
 * 格式化语音选项名称
 * 直接使用原始数据，不翻译
 */
export function formatVoiceName(voice: EdgeVoice): string {
  // 使用 ShortName 提取名字部分（如 'zh-CN-XiaoxiaoNeural' -> 'Xiaoxiao'）
  const shortName = voice.ShortName || voice.Name;
  const nameMatch = shortName.match(/zh-[A-Z]{2}(?:-[a-z]+)?-([A-Za-z]+)Neural/);
  const name = nameMatch ? nameMatch[1] : shortName;

  // 性别标签
  const genderLabel = voice.Gender === 'Female' ? '女声' : '男声';

  // 风格标签（直接使用原始英文）
  const personalities = voice.VoiceTag?.VoicePersonalities || [];
  const styleLabel = personalities.length > 0 ? `, ${personalities.join(', ')}` : '';

  return `${name} (${genderLabel}${styleLabel})`;
}

/**
 * 缓存的语音列表（避免频繁请求）
 */
let cachedVoices: EdgeVoice[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时

/**
 * 获取中文语音列表（带缓存）
 */
export async function getChineseVoices(): Promise<EdgeVoice[]> {
  const now = Date.now();

  // 检查缓存是否有效
  if (cachedVoices && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedVoices;
  }

  // 重新获取
  try {
    const allVoices = await fetchVoiceList();
    cachedVoices = filterChineseVoices(allVoices);
    cacheTimestamp = now;
    return cachedVoices;
  } catch (error) {
    // 如果获取失败但有旧缓存，返回旧缓存
    if (cachedVoices) {
      console.warn('使用旧缓存的语音列表');
      return cachedVoices;
    }
    throw error;
  }
}
