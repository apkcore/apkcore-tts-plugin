/**
 * 浏览器原生 TTS 客户端（备用方案）
 * 使用 Web Speech API
 */

import { PlayerState } from './types';

export class BrowserTtsClient {
  private utterance: SpeechSynthesisUtterance | null = null;
  private state: PlayerState = 'idle';
  private isStopping: boolean = false; // 标记是否主动停止
  private voicesLoaded: boolean = false; // 语音列表是否已加载

  constructor() {
    // 预加载语音列表
    void this.loadVoices();
  }

  /**
   * 加载语音列表（异步）
   */
  private loadVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      let voices = speechSynthesis.getVoices();
      if (voices.length > 0) {
        this.voicesLoaded = true;
        resolve(voices);
        return;
      }

      // 等待 voiceschanged 事件
      speechSynthesis.onvoiceschanged = () => {
        voices = speechSynthesis.getVoices();
        this.voicesLoaded = true;
        resolve(voices);
      };
    });
  }

  /**
   * 合成并播放语音
   */
  async speak(text: string, options?: { rate?: number; voice?: string }): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 检查浏览器是否支持 Web Speech API
        if (!('speechSynthesis' in window)) {
          reject(new Error('浏览器不支持语音合成'));
          return;
        }

        // 停止当前播放
        this.stop();
        this.isStopping = false; // 重置停止标记

        // 创建语音合成对象
        this.utterance = new SpeechSynthesisUtterance(text);

        // 设置语速（Web Speech API 的 rate 范围是 0.1-10，默认 1）
        if (options?.rate !== undefined) {
          // 将 EdgeTTS 的 -50~100 转换为 0.5~2
          const normalizedRate = 1 + (options.rate / 100);
          this.utterance.rate = Math.max(0.5, Math.min(2, normalizedRate));
        }

        // 加载语音列表
        void this.loadVoices().then(voices => {
          if (!this.utterance) return;

          // 尝试设置中文语音
          const chineseVoice = voices.find(v =>
            v.lang.startsWith('zh') || v.lang.startsWith('cmn')
          );
          if (chineseVoice) {
            this.utterance.voice = chineseVoice;
            console.log('使用语音:', chineseVoice.name, '语言:', chineseVoice.lang);
          } else {
            console.warn('未找到中文语音，可用语音:', voices.map(v => `${v.name} (${v.lang})`).join(', '));
          }
        });

        // 监听事件
        this.utterance.onstart = () => {
          this.state = 'playing';
          console.log('开始播放');
        };

        this.utterance.onend = () => {
          this.state = 'idle';
          console.log('播放结束');
          resolve();
        };

        this.utterance.onerror = (event) => {
          this.state = 'idle';

          // 如果是主动停止导致的错误，不报错
          if (this.isStopping || event.error === 'interrupted' || event.error === 'canceled') {
            console.log('朗读已停止');
            resolve(); // 主动停止视为正常结束
            return;
          }

          // 真正的错误才报告
          console.error('语音合成错误:', event);
          const error = new Error(`语音合成失败: ${event.error}`);
          reject(error);
        };

        // 开始播放
        this.state = 'loading';
        speechSynthesis.speak(this.utterance);

      } catch (error) {
        this.state = 'idle';
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * 暂停播放
   */
  pause(): void {
    if (this.state === 'playing') {
      speechSynthesis.pause();
      this.state = 'paused';
    }
  }

  /**
   * 继续播放
   */
  resume(): void {
    if (this.state === 'paused') {
      speechSynthesis.resume();
      this.state = 'playing';
    }
  }

  /**
   * 停止播放
   */
  stop(): void {
    this.isStopping = true; // 标记为主动停止
    speechSynthesis.cancel();
    this.utterance = null;
    this.state = 'idle';
  }

  /**
   * 获取当前状态
   */
  getState(): PlayerState {
    return this.state;
  }

  /**
   * 获取可用的语音列表
   */
  getVoices(): SpeechSynthesisVoice[] {
    return speechSynthesis.getVoices();
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.stop();
  }
}
