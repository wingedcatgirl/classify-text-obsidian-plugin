import { ButtonComponent, PluginSettingTab, Setting } from "obsidian";
import ClassifyText from './main';
export interface Style {
	name: string;
	css: string;
	contextMenu: boolean;
}
export interface ClassifyTextSettings {
	styles: Style[];
}

export const DEFAULT_SETTINGS: ClassifyTextSettings = {
	styles: [
		{ name: "Pink", css: "pink", contextMenu: true },
		{ name: "Smallcaps", css: "caps", contextMenu: true },
		{ name: "Pink Smallcaps", css: "pink caps", contextMenu: true },
	]
}

export class GeneralSettingsTab extends PluginSettingTab {

	plugin: ClassifyText;

	constructor(app: App, plugin: ClassifyText) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;

		this.clearHtml();

		containerEl.empty();
		containerEl.createEl('div').createEl('span', { text: 'Original plugin by ' }).createEl('a', { text: 'Juanjo Arranz', href: 'https://github.com/juanjoarranz' });
		containerEl.createEl('div').createEl('span', { text: 'Lightly edited by ' }).createEl('a', { text: 'Minty wingedcatgirl', href: 'https://github.com/wingedcatgirl' });

		containerEl.createEl("br")

		containerEl.createEl('div').createEl('span', { text: 'CSS class(es) to be applied to the selected text.' });
		containerEl.createEl('div').createEl('span', { text: '(Define these in your snippets, over ⬅️ in the main Appearance tab!)' });
		containerEl.createEl('div').createEl('span', { text: "((i'd link you there but i don't know how ._.))", cls: "small" });

		const settingHeader: HTMLDivElement = containerEl.createDiv({ cls: "setting-header" });
		settingHeader.createDiv({ text: "Name", cls: "name-header" });
		settingHeader.createDiv({ text: "Class(es)", cls: "class-header" });

		// Add Style Button
		let containerButton = settingHeader.createEl('div', { cls: 'container_add_button' });
		let addStyleButton = containerButton.createEl('button', { text: 'Add Class' });

		// Setting Items
		const settingContainer: HTMLDivElement = containerEl.createDiv();
		addStyleButton.onclick = ev => this.addStyle(settingContainer);

		this.plugin.settings.styles.forEach((s, i) => this.addStyle(settingContainer, i + 1));

		this.addInstructions(containerEl);

		this.donate(containerEl);
	}


	private clearHtml() {
		// remove disruptive classes and elements
		setTimeout(() => {
			removeClass("setting-item");
			removeClass("setting-item-info");
			removeClass("setting-item-control");
			deleteContainer(".setting-item-description");
		}, 0);

		function removeClass(className: string) {
			document.querySelectorAll("." + className)
				.forEach(i => i.removeClass(className));
		}

		function deleteContainer(selector: string) {
			document.querySelectorAll(selector)
				.forEach(i => i.parentElement?.remove());
		}
	}

	private addStyle(containerEl: HTMLElement, counter?: number) {

		this.clearHtml();

		const { styles } = this.plugin.settings;

		const settingItemContainer: HTMLDivElement = containerEl.createDiv({ cls: 'setting-item-container' });
		const stylesCounter = counter ?? styles.length + 1; // 1-based

		if (!counter) {
			const newStyle: Style = { name: "Pink Smallcaps", css: "pink caps", contextMenu: false };
			styles.push(newStyle);
			this.plugin.addClassCommand(newStyle, stylesCounter);
			this.plugin.saveSettings();
		}

		const currentStyle = styles[stylesCounter - 1];

		// Style Name
		let styleNameInput = settingItemContainer.createEl('input', { cls: 'classify-text-setting-item-name' });
		styleNameInput.value = currentStyle.name;
		styleNameInput.onchange = (async (event) => {
			const value = styleNameInput.value;
			currentStyle.name = value;
			await this.plugin.saveSettings();
			this.plugin.addClassCommand({
				name: value,
				css: currentStyle.css,
				contextMenu: currentStyle.contextMenu
			}, stylesCounter + 1);
		});

		// Style
		// new Setting(settingItemContainer)
		// 	.setClass('setting-item-name')
		// 	.addText(text => {
		// 		return text.setValue(this.plugin.settings.styles[stylesCounter - 1]?.name ?? newStyle.name)
		// 			.onChange(async (value) => {
		// 				this.plugin.settings.styles[stylesCounter - 1].name = value;
		// 				await this.plugin.saveSettings();
		// 				this.plugin.addClassCommand({
		// 					name: value,
		// 					css: this.plugin.settings.styles[stylesCounter - 1].css
		// 				}, stylesCounter);
		// 			})
		// 	});
		new Setting(settingItemContainer)
			.setClass('classify-text-setting-item-css')
			.addText(text => {
				return text.setValue(currentStyle.css)
					.onChange(async (value) => {
						currentStyle.css = value;
						await this.plugin.saveSettings();
						this.plugin.addClassCommand({
							name: currentStyle.name,
							css: value,
							contextMenu: currentStyle.contextMenu
						}, stylesCounter + 1);
					})
			});

		// Toggle Context Menu
		new Setting(settingItemContainer)
			.setClass('classify-text-setting-item-contextMenu')
			.addToggle(toggle => {
				toggle.setValue(currentStyle.contextMenu)
					.setTooltip((toggle.getValue() ? "disable" : "enable") + " contex menu")
					.onChange(async () => {
						const value = toggle.getValue();
						toggle.setTooltip((value ? "disable" : "enable") + " contex menu");
						currentStyle.contextMenu = value;
						await this.plugin.saveSettings();
					})
			});

		// Up Button
		const upDisabled = stylesCounter - 1 === 0;
		const upButtonContainer = settingItemContainer.createDiv({ cls: 'classify-text-button-container' });
		if (!upDisabled) {
			const upButton = new ButtonComponent(upButtonContainer);
			upButton.setIcon('arrow-up').setClass('classify-text-delete-class-button')
				.setTooltip("Move up")
				.onClick(() => this.moveStyle("up", stylesCounter, styles));
		}

		// Down Button
		const downDisabled = (stylesCounter === styles.length);
		const downButtonContainer = settingItemContainer.createDiv({ cls: 'classify-text-button-container' });
		if (!downDisabled) {
			const downButton = new ButtonComponent(downButtonContainer);
			downButton.setIcon('arrow-down').setClass('classify-text-delete-class-button')
				.setTooltip("Move down")
				.onClick(() => this.moveStyle("down", stylesCounter, styles));
		}

		// Delete Button
		const deleteButtonContainer = settingItemContainer.createDiv({ cls: 'classify-text-button-container' });
		const deleteButton = new ButtonComponent(deleteButtonContainer);
		deleteButton.setIcon('trash-2').setClass('classify-text-delete-class-button')
			.setTooltip("Remove Class")
			.onClick(async () => {
				this.plugin.settings.styles.splice(stylesCounter - 1, 1);
				await this.plugin.saveSettings();
				this.display();
			});

		if (!counter) setTimeout(() => this.display(), 0);
	}

	private async moveStyle(direction: "up" | "down", stylesCounter: number, styles: Style[]) {
		this.plugin.settings.styles = moveStyle(direction, stylesCounter, styles);
		await this.plugin.saveSettings();
		this.plugin.settings.styles.forEach((style, index) => {
			this.plugin.addClassCommand(style, index + 1);
		});
		this.display();

		function moveStyle(direction: "up" | "down", stylesCounter: number, styles: Style[]): Style[] {
			const movingStyle = styles.splice(stylesCounter - 1, 1)[0];
			const newPosition = direction === "up" ? stylesCounter - 2 : stylesCounter;
			const newStyles = [
				...styles.slice(0, newPosition),
				movingStyle,
				...styles.slice(newPosition)
			];
			return newStyles;
		}
	}

	private addInstructions(containerEl: HTMLElement) {

		const containerInstructions = containerEl.createEl('div', { cls: 'container-instructions' });

		// Instructions
		// With Command Palette
		containerInstructions.createEl('p', { text: 'Usage with the Command Palette:', cls: 'instructions' });
		const commandPaletteUl = containerInstructions.createEl('ul', { cls: 'instructions' });
		commandPaletteUl.createEl('li', { text: 'Select text on the editor' });
		commandPaletteUl.createEl('li', { text: 'Open the Command Palette: <Ctrl> or <Cmd> + <P>' });
		commandPaletteUl.createEl('li', { text: 'Look up the Class to apply: "Classify Text ..."' });
		commandPaletteUl.createEl('li', { text: 'Choose the Class: <Enter>' });


		// Remove Applied Styles
		containerInstructions.createEl('p', { text: 'Remove Applied Styles:', cls: 'instructions' });
		const removeUl = containerInstructions.createEl('ul', { cls: 'instructions' });
		removeUl.createEl('li', { text: 'Select the classified text on the editor' });
		removeUl.createEl('li', { text: 'Open the Command Palette: <Ctrl> or <Cmd> + <P>' });
		removeUl.createEl('li', { text: 'Look up: "Class Remove"' });
		removeUl.createEl('li', { text: 'Press <Enter>' });
	}

	private donate(containerEl: HTMLElement) {
		const donateContainer = containerEl.createEl('div', { cls: 'donate' });
		donateContainer.setCssStyles({ marginTop: '40px' });

		let buyJuanjoCoffeeImage = new Image(320);
		buyJuanjoCoffeeImage.src = 'https://imagehosting.troublecube.net/cpg/albums/userpics/10001/2/buy_juanjo_a_coffee~0.png';
		donateContainer.createEl('a', { href: 'https://ko-fi.com/F1F6H4TAR', text: '', title: "" }).appendChild(buyJuanjoCoffeeImage);
		donateContainer.createEl("br")
		let buyMintyCoffeeImage = new Image(240);
		buyMintyCoffeeImage.src = 'https://imagehosting.troublecube.net/cpg/albums/userpics/10001/2/buy_minty_a_coffee.png';
		donateContainer.createEl('a', { href: 'https://ko-fi.com/wingedcatgirl', text: '' }).appendChild(buyMintyCoffeeImage);

	}
}
