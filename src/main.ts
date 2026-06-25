import {
	Editor,
	MarkdownView,
	Notice,
	Plugin,
} from 'obsidian';
import {
	DEFAULT_SETTINGS,
	MyPluginSettings,
	SampleSettingTab,
} from './settings';
import { EdgeTtsClient } from './edgetts/client';
import { AudioPlayer } from './edgetts/audio-player';
import { BrowserTtsClient } from './edgetts/browser-tts';
import { testEdgeTTSConnection } from './edgetts/test';

// Remember to rename these classes and interfaces!

export default class MyPlugin extends Plugin {
	settings!: MyPluginSettings;
	private ttsClient!: EdgeTtsClient;
	private audioPlayer!: AudioPlayer;
	private browserTts!: BrowserTtsClient;
	private statusBarItem!: HTMLElement;
	private useBrowserTts: boolean = false; // 是否使用浏览器 TTS
	private floatingStopButton: HTMLElement | null = null; // 悬浮停止按钮

	async onload() {
		await this.loadSettings();

		// 初始化 TTS 组件
		this.ttsClient = new EdgeTtsClient();
		this.audioPlayer = new AudioPlayer();
		this.browserTts = new BrowserTtsClient();
		this.statusBarItem = this.addStatusBarItem();

		// 默认尝试使用浏览器 TTS（更可靠）
		this.useBrowserTts = true;
		this.updateStatusBar('就绪 (浏览器TTS)');

		// 注册 TTS 命令
		this.addCommand({
			id: 'tts-read-selection',
			name: '朗读文本',
			icon: 'volume-2',
			hotkeys: [{ modifiers: ['Ctrl'], key: 'r' }], // 默认快捷键 Ctrl+R
			editorCallback: async (editor: Editor) => {
				const selection = editor.getSelection();
				if (selection) {
					// 有选中文本，朗读选中内容
					await this.speakText(selection);
				} else {
					// 没有选中文本，朗读全文
					const fullText = editor.getValue();
					if (fullText) {
						await this.speakText(fullText);
					} else {
						new Notice('当前文档为空');
					}
				}
			},
		});

		this.addCommand({
			id: 'tts-test-connection',
			name: '测试 EdgeTTS 连接',
			callback: async () => {
				new Notice('开始测试连接，请查看控制台');
				await testEdgeTTSConnection();
			},
		});

		this.addCommand({
			id: 'tts-stop',
			name: '停止朗读',
			icon: 'square',
			hotkeys: [{ modifiers: ['Ctrl', 'Shift'], key: 'S' }], // 默认快捷键 Ctrl+Shift+S
			callback: () => {
				this.stopReading();
			},
		});

		this.addCommand({
			id: 'tts-pause-resume',
			name: '暂停/继续朗读',
			icon: 'pause',
			hotkeys: [{ modifiers: ['Ctrl'], key: 'p' }], // 默认快捷键 Ctrl+P (可能冲突，用户可自定义)
			callback: () => {
				if (this.useBrowserTts) {
					const state = this.browserTts.getState();
					if (state === 'playing') {
						this.browserTts.pause();
						this.updateStatusBar('已暂停');
					} else if (state === 'paused') {
						this.browserTts.resume();
						this.updateStatusBar('播放中');
					}
				} else {
					const state = this.audioPlayer.getState();
					if (state === 'playing') {
						this.audioPlayer.pause();
						this.updateStatusBar('已暂停');
					} else if (state === 'paused') {
						this.audioPlayer.resume();
						this.updateStatusBar('播放中');
					}
				}
			},
		});

		this.addCommand({
			id: 'tts-toggle-engine',
			name: '切换 TTS 引擎',
			callback: () => {
				this.useBrowserTts = !this.useBrowserTts;
				const engine = this.useBrowserTts ? '浏览器TTS' : 'EdgeTTS';
				new Notice(`已切换到: ${engine}`);
				this.updateStatusBar(`就绪 (${engine})`);
			},
		});

		// 添加 Ribbon 图标（侧边栏快捷按钮）
		this.addRibbonIcon('volume-2', '朗读文本', async () => {
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (activeView) {
				const editor = activeView.editor;
				const selection = editor.getSelection();
				if (selection) {
					// 有选中文本，朗读选中内容
					await this.speakText(selection);
				} else {
					// 没有选中文本，朗读全文
					const fullText = editor.getValue();
					if (fullText) {
						await this.speakText(fullText);
					} else {
						new Notice('当前文档为空');
					}
				}
			}
		});

		// 添加右键菜单
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor) => {
				const selection = editor.getSelection();
				menu.addItem((item) => {
					if (selection) {
						// 有选中文本
						item
							.setTitle('🔊 朗读选中文本')
							.setIcon('volume-2')
							.onClick(async () => {
								await this.speakText(selection);
							});
					} else {
						// 没有选中文本
						item
							.setTitle('🔊 朗读全文')
							.setIcon('volume-2')
							.onClick(async () => {
								const fullText = editor.getValue();
								if (fullText) {
									await this.speakText(fullText);
								} else {
									new Notice('当前文档为空');
								}
							});
					}
				});
			})
		);

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {
		this.audioPlayer.dispose();  // 释放音频资源
		this.browserTts.dispose();   // 释放浏览器 TTS 资源
		this.ttsClient.disconnect();  // 关闭 WebSocket
		this.hideFloatingStopButton(); // 清理悬浮按钮
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MyPluginSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async speakText(text: string): Promise<void> {
		try {
			// 文本长度验证
			if (text.length > this.settings.edgeTts.maxTextLength) {
				new Notice(`文本过长（最多 ${this.settings.edgeTts.maxTextLength} 字符）`);
				return;
			}

			this.updateStatusBar('正在合成...');
			this.showFloatingStopButton(); // 显示悬浮停止按钮

			if (this.useBrowserTts) {
				// 使用浏览器原生 TTS
				await this.browserTts.speak(text, {
					rate: this.settings.edgeTts.rate
				});
				this.updateStatusBar('完成');
				this.hideFloatingStopButton(); // 播放完成，隐藏按钮
			} else {
				// 使用 EdgeTTS (WebSocket)
				const audioData = await this.ttsClient.synthesize(text, {
					voice: this.settings.edgeTts.voice,
					rate: this.settings.edgeTts.rate,
				});

				this.updateStatusBar('播放中...');
				await this.audioPlayer.play(audioData);
				this.hideFloatingStopButton(); // 播放完成，隐藏按钮
			}

		} catch (error) {
			console.error('TTS 错误:', error);
			new Notice(`TTS 失败: ${(error as Error).message}`);
			this.updateStatusBar('错误');
			this.hideFloatingStopButton(); // 出错时也隐藏按钮

			// 如果 EdgeTTS 失败，提示切换到浏览器 TTS
			if (!this.useBrowserTts) {
				new Notice('EdgeTTS 连接失败，建议使用"切换 TTS 引擎"命令切换到浏览器TTS');
			}
		}
	}

	private updateStatusBar(status: string): void {
		this.statusBarItem.setText(`TTS: ${status}`);
	}

	/**
	 * 显示悬浮停止按钮
	 */
	private showFloatingStopButton(): void {
		if (this.floatingStopButton) return; // 已存在，不重复创建

		// 创建悬浮按钮容器
		this.floatingStopButton = document.body.createDiv('tts-floating-stop-button');
		this.floatingStopButton.style.cssText = `
			position: fixed;
			bottom: 80px;
			right: 30px;
			z-index: 1000;
			background: var(--interactive-accent);
			color: white;
			border: none;
			border-radius: 50%;
			width: 60px;
			height: 60px;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
			transition: all 0.3s ease;
			font-size: 24px;
		`;

		// 添加图标
		this.floatingStopButton.innerHTML = '⏹️';
		this.floatingStopButton.setAttribute('aria-label', '停止朗读');

		// 鼠标悬停效果
		this.floatingStopButton.addEventListener('mouseenter', () => {
			if (this.floatingStopButton) {
				this.floatingStopButton.style.transform = 'scale(1.1)';
			}
		});

		this.floatingStopButton.addEventListener('mouseleave', () => {
			if (this.floatingStopButton) {
				this.floatingStopButton.style.transform = 'scale(1)';
			}
		});

		// 点击事件
		this.floatingStopButton.addEventListener('click', () => {
			this.stopReading();
		});
	}

	/**
	 * 隐藏悬浮停止按钮
	 */
	private hideFloatingStopButton(): void {
		if (this.floatingStopButton) {
			this.floatingStopButton.remove();
			this.floatingStopButton = null;
		}
	}

	/**
	 * 停止朗读的统一方法
	 */
	private stopReading(): void {
		if (this.useBrowserTts) {
			this.browserTts.stop();
		} else {
			this.audioPlayer.stop();
		}
		this.updateStatusBar('已停止');
		this.hideFloatingStopButton();
	}
}
