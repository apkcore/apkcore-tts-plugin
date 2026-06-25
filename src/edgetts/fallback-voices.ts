/**
 * 备用的中文语音列表（当 API 请求失败时使用）
 */

import { EdgeVoice } from './types';

export const FALLBACK_CHINESE_VOICES: EdgeVoice[] = [
  {
    Name: 'zh-CN-XiaoxiaoNeural',
    Gender: 'Female',
    Locale: 'zh-CN',
    SuggestedCodec: 'audio-24khz-48kbitrate-mono-mp3',
    FriendlyName: 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)',
    Status: 'GA',
    VoiceTag: {
      ContentCategories: ['General'],
      VoicePersonalities: ['Friendly', 'Positive']
    }
  },
  {
    Name: 'zh-CN-YunxiNeural',
    Gender: 'Male',
    Locale: 'zh-CN',
    SuggestedCodec: 'audio-24khz-48kbitrate-mono-mp3',
    FriendlyName: 'Microsoft Yunxi Online (Natural) - Chinese (Mainland)',
    Status: 'GA',
    VoiceTag: {
      ContentCategories: ['General'],
      VoicePersonalities: ['Warm']
    }
  },
  {
    Name: 'zh-CN-YunyangNeural',
    Gender: 'Male',
    Locale: 'zh-CN',
    SuggestedCodec: 'audio-24khz-48kbitrate-mono-mp3',
    FriendlyName: 'Microsoft Yunyang Online (Natural) - Chinese (Mainland)',
    Status: 'GA',
    VoiceTag: {
      ContentCategories: ['News'],
      VoicePersonalities: ['Professional']
    }
  },
  {
    Name: 'zh-CN-XiaoyiNeural',
    Gender: 'Female',
    Locale: 'zh-CN',
    SuggestedCodec: 'audio-24khz-48kbitrate-mono-mp3',
    FriendlyName: 'Microsoft Xiaoyi Online (Natural) - Chinese (Mainland)',
    Status: 'GA',
    VoiceTag: {
      ContentCategories: ['General'],
      VoicePersonalities: ['Gentle']
    }
  },
  {
    Name: 'zh-CN-YunjianNeural',
    Gender: 'Male',
    Locale: 'zh-CN',
    SuggestedCodec: 'audio-24khz-48kbitrate-mono-mp3',
    FriendlyName: 'Microsoft Yunjian Online (Natural) - Chinese (Mainland)',
    Status: 'GA',
    VoiceTag: {
      ContentCategories: ['Sports'],
      VoicePersonalities: ['Energetic']
    }
  },
  {
    Name: 'zh-CN-YunxiaNeural',
    Gender: 'Male',
    Locale: 'zh-CN',
    SuggestedCodec: 'audio-24khz-48kbitrate-mono-mp3',
    FriendlyName: 'Microsoft Yunxia Online (Natural) - Chinese (Mainland)',
    Status: 'GA',
    VoiceTag: {
      ContentCategories: ['General'],
      VoicePersonalities: ['Energetic']
    }
  },
  {
    Name: 'zh-CN-XiaoxuanNeural',
    Gender: 'Female',
    Locale: 'zh-CN',
    SuggestedCodec: 'audio-24khz-48kbitrate-mono-mp3',
    FriendlyName: 'Microsoft Xiaoxuan Online (Natural) - Chinese (Mainland)',
    Status: 'GA',
    VoiceTag: {
      ContentCategories: ['General'],
      VoicePersonalities: ['Calm']
    }
  },
  {
    Name: 'zh-CN-XiaohanNeural',
    Gender: 'Female',
    Locale: 'zh-CN',
    SuggestedCodec: 'audio-24khz-48kbitrate-mono-mp3',
    FriendlyName: 'Microsoft Xiaohan Online (Natural) - Chinese (Mainland)',
    Status: 'GA',
    VoiceTag: {
      ContentCategories: ['General'],
      VoicePersonalities: ['Calm']
    }
  },
  {
    Name: 'zh-CN-XiaomoNeural',
    Gender: 'Female',
    Locale: 'zh-CN',
    SuggestedCodec: 'audio-24khz-48kbitrate-mono-mp3',
    FriendlyName: 'Microsoft Xiaomo Online (Natural) - Chinese (Mainland)',
    Status: 'GA',
    VoiceTag: {
      ContentCategories: ['General'],
      VoicePersonalities: ['Gentle']
    }
  },
  {
    Name: 'zh-CN-XiaoruiNeural',
    Gender: 'Female',
    Locale: 'zh-CN',
    SuggestedCodec: 'audio-24khz-48kbitrate-mono-mp3',
    FriendlyName: 'Microsoft Xiaorui Online (Natural) - Chinese (Mainland)',
    Status: 'GA',
    VoiceTag: {
      ContentCategories: ['General'],
      VoicePersonalities: ['Calm']
    }
  }
];
