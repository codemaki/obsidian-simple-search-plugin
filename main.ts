import {
	App,
	Plugin,
	PluginSettingTab,
	Setting,
	TFile,
	FuzzySuggestModal,
	prepareQuery,
	fuzzySearch,
	SearchResult as FuzzySearchResult,
	Notice
} from 'obsidian';

interface SearchPluginSettings {
	searchDelay: number;
	maxResults: number;
	showPreview: boolean;
	contextLength: number;
}

const DEFAULT_SETTINGS: SearchPluginSettings = {
	searchDelay: 300,
	maxResults: 50,
	showPreview: true,
	contextLength: 100
}

interface SearchResult {
	file: TFile;
	score: number;
	matchedContent?: string;
	imagePath?: string;
}

export default class AdvancedSearchPlugin extends Plugin {
	settings: SearchPluginSettings;

	async onload() {
		await this.loadSettings();

		// Add ribbon icon
		this.addRibbonIcon('search', 'Advanced Search', () => {
			new AdvancedSearchModal(this.app, this).open();
		});

		// Add command
		this.addCommand({
			id: 'open-advanced-search',
			name: 'Open Advanced Search',
			callback: () => {
				new AdvancedSearchModal(this.app, this).open();
			},
			hotkeys: [{ modifiers: ["Mod", "Shift"], key: "f" }]
		});

		// Add settings tab
		this.addSettingTab(new AdvancedSearchSettingTab(this.app, this));
	}

	onunload() {
		// Cleanup if needed
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class AdvancedSearchModal extends FuzzySuggestModal<SearchResult> {
	plugin: AdvancedSearchPlugin;
	searchResults: SearchResult[] = [];
	currentQuery: string = '';

	constructor(app: App, plugin: AdvancedSearchPlugin) {
		super(app);
		this.plugin = plugin;
		this.setPlaceholder('Search files by name or content...');
	}

	getItems(): SearchResult[] {
		return this.searchResults;
	}

	getItemText(result: SearchResult): string {
		return result.file.basename;
	}

	onChooseItem(result: SearchResult): void {
		// Open the selected file
		this.app.workspace.openLinkText(result.file.path, '', false);
	}

	async getSuggestions(query: string): Promise<SearchResult[]> {
		this.currentQuery = query;

		if (!query || query.length < 2) {
			return [];
		}

		const files = this.app.vault.getMarkdownFiles();
		const results: SearchResult[] = [];

		// Prepare fuzzy search query
		const preparedQuery = prepareQuery(query);

		for (const file of files) {
			// Search in filename
			const filenameMatch = fuzzySearch(preparedQuery, file.basename);

			// Read file content for search
			const content = await this.app.vault.cachedRead(file);
			const contentLower = content.toLowerCase();
			const queryLower = query.toLowerCase();

			// Check if query exists in content
			const contentMatch = contentLower.includes(queryLower);

			if (filenameMatch || contentMatch) {
				let score = 0;
				let matchedContent = '';
				let imagePath: string | undefined;

				// Calculate score
				if (filenameMatch) {
					score += filenameMatch.score * 10;
				}
				if (contentMatch) {
					score += 5;
					matchedContent = this.extractContext(content, query, this.plugin.settings.contextLength);
				}

				// Boost recent files
				const daysSinceModified = (Date.now() - file.stat.mtime) / (1000 * 60 * 60 * 24);
				score += Math.max(0, 10 - daysSinceModified);

				// Extract first image from file
				imagePath = this.extractFirstImage(content);

				results.push({
					file,
					score,
					matchedContent,
					imagePath
				});
			}
		}

		// Sort by score
		results.sort((a, b) => b.score - a.score);

		// Limit results
		return results.slice(0, this.plugin.settings.maxResults);
	}

	renderSuggestion(result: SearchResult, el: HTMLElement): void {
		const container = el.createDiv({ cls: 'advanced-search-suggestion' });

		// Create main content area
		const contentArea = container.createDiv({ cls: 'search-content' });

		// File name (title)
		const titleEl = contentArea.createDiv({ cls: 'search-title' });
		titleEl.setText(result.file.basename);

		// File path
		const pathEl = contentArea.createDiv({ cls: 'search-path' });
		pathEl.setText(result.file.path);

		// Matched content preview
		if (result.matchedContent && this.plugin.settings.showPreview) {
			const previewEl = contentArea.createDiv({ cls: 'search-preview' });
			this.highlightQuery(previewEl, result.matchedContent, this.currentQuery);
		}

		// Image thumbnail
		if (result.imagePath) {
			const thumbnailContainer = container.createDiv({ cls: 'search-thumbnail' });
			const img = thumbnailContainer.createEl('img', { cls: 'search-thumbnail-img' });

			// Get the actual file path for the image
			const imageFile = this.app.metadataCache.getFirstLinkpathDest(result.imagePath, result.file.path);
			if (imageFile) {
				const resourcePath = this.app.vault.getResourcePath(imageFile);
				img.src = resourcePath;
			}
		}
	}

	extractContext(content: string, query: string, contextLength: number): string {
		const index = content.toLowerCase().indexOf(query.toLowerCase());
		if (index === -1) return '';

		const start = Math.max(0, index - contextLength);
		const end = Math.min(content.length, index + query.length + contextLength);

		let context = content.slice(start, end);

		// Add ellipsis
		if (start > 0) context = '...' + context;
		if (end < content.length) context = context + '...';

		// Remove newlines and extra spaces
		context = context.replace(/\n/g, ' ').replace(/\s+/g, ' ');

		return context;
	}

	extractFirstImage(content: string): string | undefined {
		// Match markdown image syntax: ![alt](path)
		const markdownImageRegex = /!\[.*?\]\((.*?)\)/;
		const match = content.match(markdownImageRegex);

		if (match && match[1]) {
			return match[1];
		}

		// Also try to match wiki-style images: ![[image.png]]
		const wikiImageRegex = /!\[\[(.*?)\]\]/;
		const wikiMatch = content.match(wikiImageRegex);

		if (wikiMatch && wikiMatch[1]) {
			return wikiMatch[1];
		}

		return undefined;
	}

	highlightQuery(el: HTMLElement, text: string, query: string): void {
		const lowerText = text.toLowerCase();
		const lowerQuery = query.toLowerCase();
		const index = lowerText.indexOf(lowerQuery);

		if (index === -1) {
			el.setText(text);
			return;
		}

		// Split text into parts: before match, match, after match
		const before = text.slice(0, index);
		const match = text.slice(index, index + query.length);
		const after = text.slice(index + query.length);

		el.appendText(before);
		const highlighted = el.createEl('strong', { cls: 'search-highlight' });
		highlighted.setText(match);
		el.appendText(after);
	}
}

class AdvancedSearchSettingTab extends PluginSettingTab {
	plugin: AdvancedSearchPlugin;

	constructor(app: App, plugin: AdvancedSearchPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Advanced Search Settings' });

		new Setting(containerEl)
			.setName('Search Delay')
			.setDesc('Delay in milliseconds before searching (reduces lag while typing)')
			.addText(text => text
				.setPlaceholder('300')
				.setValue(String(this.plugin.settings.searchDelay))
				.onChange(async (value) => {
					const numValue = Number(value);
					if (!isNaN(numValue) && numValue >= 0) {
						this.plugin.settings.searchDelay = numValue;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('Maximum Results')
			.setDesc('Maximum number of search results to display')
			.addText(text => text
				.setPlaceholder('50')
				.setValue(String(this.plugin.settings.maxResults))
				.onChange(async (value) => {
					const numValue = Number(value);
					if (!isNaN(numValue) && numValue > 0) {
						this.plugin.settings.maxResults = numValue;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('Show Content Preview')
			.setDesc('Show matched content preview in search results')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showPreview)
				.onChange(async (value) => {
					this.plugin.settings.showPreview = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Context Length')
			.setDesc('Number of characters to show around matched content')
			.addText(text => text
				.setPlaceholder('100')
				.setValue(String(this.plugin.settings.contextLength))
				.onChange(async (value) => {
					const numValue = Number(value);
					if (!isNaN(numValue) && numValue > 0) {
						this.plugin.settings.contextLength = numValue;
						await this.plugin.saveSettings();
					}
				}));
	}
}
