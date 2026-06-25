/**
 * EdgeTTS TypeScript 接口定义
 */

export interface SynthesisOptions {
  voice: string;           // 音色 ID (如 'zh-CN-XiaoxiaoNeural')
  rate: number;            // 语速 (-50 到 100, 0 为正常速度)
  pitch?: number;          // 音调 (-50 到 50, 0 为正常音调)
  volume?: number;         // 音量 (0 到 100, 50 为正常音量)
}

export interface EdgeTtsSettings {
  voice: string;
  rate: number;
  autoPlay: boolean;
  maxTextLength: number;   // 单次最大文本长度，默认 1800
}

export type PlayerState = 'idle' | 'playing' | 'paused' | 'loading';

export interface AudioFrame {
  data: ArrayBuffer;
  path: string;
  contentType: string;
}

export interface EdgeVoice {
  Name: string;                  // 如 'zh-CN-XiaoxiaoNeural'
  ShortName?: string;            // 同 Name（可选）
  Gender: string;                // 'Female' 或 'Male'
  Locale: string;                // 如 'zh-CN'
  SuggestedCodec: string;        // 如 'audio-24khz-48kbitrate-mono-mp3'
  FriendlyName: string;          // 如 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)'
  Status: string;                // 如 'GA'
  VoiceTag?: {
    ContentCategories: string[]; // 如 ['General', 'News']
    VoicePersonalities: string[]; // 如 ['Friendly', 'Positive']
  };
}
