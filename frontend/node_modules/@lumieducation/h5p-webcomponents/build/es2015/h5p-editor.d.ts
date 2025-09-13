import type { IEditorModel, IContentMetadata } from '@lumieducation/h5p-server';
declare global {
    /**
     * The H5P core "class" for the editor.
     */
    var H5PEditor: any;
    /**
     * Used by the H5P core for namespacing.
     */
    var ns: any;
}
export declare class H5PEditorComponent extends HTMLElement {
    constructor();
    get contentId(): string;
    set contentId(contentId: string);
    /**
     * Called when the component needs to load data about content. The endpoint
     * called in here combines the results of H5PEditor.render(...) and
     * H5PEditor.getContent(...) to avoid too many requests.
     *
     * Note that the library, metadata and params property of the returned
     * object must only be defined if contentId is defined.
     *
     * Should throw an error with a message in the message property if something
     * goes wrong.
     */
    get loadContentCallback(): (contentId: string) => Promise<IEditorModel & {
        library?: string;
        metadata?: IContentMetadata;
        params?: any;
    }>;
    set loadContentCallback(callback: (contentId: string) => Promise<IEditorModel & {
        library?: string;
        metadata?: IContentMetadata;
        params?: any;
    }>);
    /**
     * Indicates changes to which attributes should trigger calls to
     * attributeChangedCallback.
     */
    static get observedAttributes(): string[];
    private static template;
    /**
     * Called when the component needs to save data about content. The endpoint
     * called here should call H5PEditor.saveOrUpdateContentReturnMetaData(...).
     * Note that it makes sense to use PATCH requests for updates and POST
     * requests for new content, but it's up to you how you implement this. See
     * defaultSaveContentCallback for an example.
     *
     * Should throw an error with a message in the message property if something
     * goes wrong.
     * @param contentId the contentId which needs to be saved; can be undefined
     * for new content, which hasn't been saved before
     * @param requestBody the data needed by the server; usually encoded as JSON
     * string and sent to the server
     * @returns the newly assigned content id and metadata
     */
    saveContentCallback: (contentId: string, requestBody: {
        library: string;
        params: any;
    }) => Promise<{
        contentId: string;
        metadata: IContentMetadata;
    }>;
    private editorInstance;
    /**
     * Stores the H5P instance (H5P native object of the core).
     */
    private privateLoadContentCallback;
    private resizeObserver;
    private root;
    private static initTemplate;
    /**
     * Called when one of the attributes in observedAttributes changes.
     */
    attributeChangedCallback(name: string, oldVal: any, newVal: any): Promise<void>;
    /**
     * Called when the component is added to the DOM.
     */
    connectedCallback(): Promise<void>;
    /**
     * Called when the component is removed from the DOM.
     */
    disconnectedCallback(): void;
    /**
     * Call this method when the iframe containing the editor needs to be
     * resized, e.g. because the some
     */
    resize: () => void;
    /**
     * Call save() to get data from the H5P editor and send it to the server.
     * You can use the saveContentCallback hook to customize server requests.
     * The component emits 'saved', 'save-error' and 'validation-error' events,
     * depending on success of the function. You can subscribe to those or use
     * the promise's return value and catch the errors in a try-catch block.
     * @throws an error if something went wrong
     * @returns the contentId and metadata of the saved content
     */
    save: () => Promise<{
        contentId: string;
        metadata: IContentMetadata;
    }>;
    /**
     * Dispatches an event of the specified name and throws an error whose error
     * message starts with the eventName.
     * @param eventName
     * @param message
     */
    private dispatchAndThrowError;
    /**
     * Called by the global H5P event dispatcher when any editor was loaded.
     */
    private onEditorLoaded;
    /**
     * Displays the editor inside the component by creating a new DOM tree.
     * @param contentId the content id to display or undefined if a new piece
     * of content was created
     */
    private render;
}
