/**
 * Adds JavaScript file references to the DOM of the target element. If the
 * script was already added to the target element, it is not added a second
 * time. Makes sure the scripts are loaded in the order of the list.
 * @param scripts a list URLS to JavaScript files
 * @param target the element to which the scripts should be added.
 * @returns ignore the return value
 */
export declare function addScripts(scripts: string[], target: HTMLElement): Promise<any>;
/**
 * Adds links to CSS files to the DOM of the target element. If a stylesheet was
 * already added to the target element, it is not added a second time.
 * @param styles a list of URLs to stylesheets to add
 * @param target the element to which the scripts should be added
 * @param addFontsToHead if true, @font-face rules found in the loaded
 * stylesheets will also be duplicated and added to the head of the document.
 * This is necessary to load fonts that should be displayed inside the shadow
 * DOM.
 */
export declare function addStylesheets(styles: string[], target: HTMLElement): void;
