import { App, Editor, MarkdownView, Menu, Modal, Plugin } from 'obsidian';

import { DEFAULT_SETTINGS, ClassifyTextSettings, GeneralSettingsTab, Style } from './settings'

export type EnhancedApp = App & {
	commands: { executeCommandById: Function };
};

export default class ClassifyText extends Plugin {
	settings: ClassifyTextSettings;

	async onload(): Promise<void> {

		await this.loadSettings();
		this.addCommand({
			id: 'remove-class',
			name: 'Remove Class',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();
				editor.replaceSelection(this.betterClearHTMLTags(selection));
			}
		});

		// Class Commands
		this.settings.styles.forEach((style, index) => {
			this.addClassCommand(style, index + 1);
		});


		// Classes Context Menu
		this.registerEvent(
			this.app.workspace.on("editor-menu", this.classifyTextInContextMenu)
		);

		this.updateBodyListClass();
		this.addSettingTab(new GeneralSettingsTab(this.app, this));
	}

	async loadSettings() {
		this.settings = { ...DEFAULT_SETTINGS, ...await this.loadData() };
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	clearHTMLTags(strToSanitize: string): string {
		return strToSanitize.replace(/(<([^>]+)>)/gi, '');
	}

	betterClearHTMLTags(strToSanitize: string): string {
		let myHTML = new DOMParser()
			.parseFromString(strToSanitize, 'text/html');
		return myHTML.body.textContent || '';
	}

	// index: 1-based
	addClassCommand(style: Style, index: number) {
		const isHighlight = style.css.indexOf("background-color") !== -1;
		const tag = isHighlight ? "mark" : "span";
		this.addCommand({
			id: `style${index}`,
			name: `${style.name}`,
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const selection = editor.getSelection();
				editor.replaceSelection(`<${tag} class="${style.css}">${selection}</${tag}>`);
			}
		});
	}

	classifyTextInContextMenu = (menu: Menu, editor: Editor) => {
		const enhancedApp = this.app as EnhancedApp;

		menu.addItem((item) =>
			item
				.setTitle("Remove Class")
				.setIcon("eraser")
				.onClick(() => {
					enhancedApp.commands.executeCommandById(`classify-text:remove-class`);
				})
		);

		this.settings.styles.forEach((style, index) => {
			if (style.contextMenu) {
				menu.addItem((item) =>
					item
						.setTitle(style.name)
						.setIcon("highlighter")
						.onClick(() => {
							enhancedApp.commands.executeCommandById(`classify-text:style${index + 1}`);
						})
				);
			}
		});
	}

	updateBodyListClass() {
		document.body.classList.add("classify-text");
	}
}


