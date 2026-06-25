import { App, PluginSettingTab, Setting } from 'obsidian';
import ApkcoreTtsPlugin from './main';
import { getChineseVoices, formatVoiceName } from './edgetts/voice-list';
import { EdgeVoice } from './edgetts/types';

export interface ApkcoreTtsSettings {
	mySetting: string;
	edgeTts: {
		voice: string;
		rate: number;
		autoPlay: boolean;
		maxTextLength: number;
	};
}

export const DEFAULT_SETTINGS: ApkcoreTtsSettings = {
	mySetting: 'default',
	edgeTts: {
		voice: 'zh-CN-XiaoxiaoNeural',  // 默认女声
		rate: 0,                          // 正常语速
		autoPlay: true,
		maxTextLength: 1800,
	},
};

export class ApkcoreTtsSettingTab extends PluginSettingTab {
	plugin: ApkcoreTtsPlugin;
	private voiceList: EdgeVoice[] = [];
	private voiceDropdown: Setting | null = null;

	constructor(app: App, plugin: ApkcoreTtsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Settings #1')
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder('Enter your secret')
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					}),
			);

		// EdgeTTS 设置标题
		new Setting(containerEl).setName('EdgeTTS 设置').setHeading();

		// 语音选择下拉框（动态加载）
		const voiceSetting = new Setting(containerEl)
			.setName('语音')
			.setDesc('正在加载语音列表...');

		this.voiceDropdown = voiceSetting;

		// 异步加载语音列表
		void this.loadVoiceList(voiceSetting);

		// 语速滑块
		new Setting(containerEl)
			.setName('语速')
			.setDesc('调整朗读速度（-50% 到 +100%）')
			.addSlider((slider) => slider
				.setLimits(-50, 100, 10)
				.setValue(this.plugin.settings.edgeTts.rate)
				.onChange(async (value) => {
					this.plugin.settings.edgeTts.rate = value;
					await this.plugin.saveSettings();
				}));

		// 最大文本长度
		new Setting(containerEl)
			.setName('最大文本长度')
			.setDesc('单次朗读的最大字符数')
			.addText((text) => text
				.setPlaceholder('1800')
				.setValue(this.plugin.settings.edgeTts.maxTextLength.toString())
				.onChange(async (value) => {
					const numValue = parseInt(value);
					if (!isNaN(numValue) && numValue > 0) {
						this.plugin.settings.edgeTts.maxTextLength = numValue;
						await this.plugin.saveSettings();
					}
				}));
	}

	/**
	 * 异步加载语音列表并更新下拉框
	 */
	private async loadVoiceList(setting: Setting): Promise<void> {
		try {
			// 获取中文语音列表
			this.voiceList = await getChineseVoices();

			// 更新描述
			setting.setDesc(`选择 TTS 语音（共 ${this.voiceList.length} 个中文语音）`);

			// 添加下拉框
			setting.addDropdown((dropdown) => {
				// 添加所有中文语音选项
				for (const voice of this.voiceList) {
					const displayName = formatVoiceName(voice);
					dropdown.addOption(voice.Name, displayName);
				}

				dropdown
					.setValue(this.plugin.settings.edgeTts.voice)
					.onChange(async (value) => {
						this.plugin.settings.edgeTts.voice = value;
						await this.plugin.saveSettings();
					});
			});

		} catch (error) {
			console.error('加载语音列表失败:', error);
			setting.setDesc('⚠️ 语音列表加载失败，使用默认选项');

			// 加载失败时使用静态备选列表
			setting.addDropdown((dropdown) => dropdown
				.addOption('zh-CN-XiaoxiaoNeural', 'Xiaoxiao (女声)')
				.addOption('zh-CN-YunxiNeural', 'Yunxi (男声)')
				.addOption('zh-CN-YunyangNeural', 'Yunyang (男声)')
				.addOption('zh-CN-XiaoyiNeural', 'Xiaoyi (女声)')
				.addOption('zh-CN-YunjianNeural', 'Yunjian (男声)')
				.addOption('zh-CN-YunxiaNeural', 'Yunxia (男声)')
				.setValue(this.plugin.settings.edgeTts.voice)
				.onChange(async (value) => {
					this.plugin.settings.edgeTts.voice = value;
					await this.plugin.saveSettings();
				}));
		}
	}
}
