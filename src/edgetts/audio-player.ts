/**
 * EdgeTTS 音频播放控制器
 */

import { PlayerState } from './types';

export class AudioPlayer {
  private audio: HTMLAudioElement | null = null;
  private blobUrl: string | null = null;
  private state: PlayerState = 'idle';

  /**
   * 播放 MP3 数据
   */
  async play(audioData: ArrayBuffer): Promise<void> {
    // 先清理旧的音频
    this.cleanup();

    this.state = 'loading';

    // 创建 Blob URL
    const blob = new Blob([audioData], { type: 'audio/mpeg' });
    this.blobUrl = URL.createObjectURL(blob);

    // 创建音频元素
    this.audio = new Audio(this.blobUrl);

    // 监听播放结束
    this.audio.addEventListener('ended', () => {
      this.cleanup();
      this.state = 'idle';
    });

    // 监听错误
    this.audio.addEventListener('error', (e) => {
      console.error('音频播放错误:', e);
      this.cleanup();
      this.state = 'idle';
    });

    // 开始播放
    this.state = 'playing';
    await this.audio.play();
  }

  /**
   * 暂停播放
   */
  pause(): void {
    if (this.audio && this.state === 'playing') {
      this.audio.pause();
      this.state = 'paused';
    }
  }

  /**
   * 继续播放
   */
  resume(): void {
    if (this.audio && this.state === 'paused') {
      this.audio.play().catch((err) => {
        console.error('Resume playback failed:', err);
      });
      this.state = 'playing';
    }
  }

  /**
   * 停止播放并清理资源
   */
  stop(): void {
    this.cleanup();
    this.state = 'idle';
  }

  /**
   * 获取当前状态
   */
  getState(): PlayerState {
    return this.state;
  }

  /**
   * 释放资源 (插件卸载时必须调用)
   */
  dispose(): void {
    this.cleanup();
    this.state = 'idle';
  }

  /**
   * 内部清理方法
   */
  private cleanup(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio = null;
    }

    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
  }
}
