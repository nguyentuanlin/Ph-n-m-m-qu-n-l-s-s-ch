import type { IPlayerModel } from '@lumieducation/h5p-server';
import { IH5P, IH5PInstance } from './h5p-types';
export interface IxAPIEvent {
    data: {
        statement: any;
    };
}
export interface IContext {
    contentId: string;
}
/**
 * A Web Component displaying H5P content.
 */
export declare class H5PPlayerComponent extends HTMLElement {
    get contentId(): string;
    set contentId(contentId: string);
    get contextId(): string;
    set contextId(contextId: string);
    get asUserId(): string;
    set asUserId(asUserId: string);
    get readOnlyState(): string;
    set readOnlyState(readOnlyState: string);
    /**
     * The internal H5P instance object of the H5P content.
     *
     * Only available after the `initialized` event was fired. Important: This
     * object is only partially typed and there are more properties and methods
     * on it!
     */
    get h5pInstance(): IH5PInstance;
    private set h5pInstance(value);
    /**
     * The global H5P object / namespace (normally accessible through "H5P..."
     * or "window.H5P") of the content type. Depending on the embed type this
     * can be an object from the internal iframe, so you can use it to break the
     * barrier of the iframe and execute JavaScript inside the iframe.
     *
     * Only available after the `initialized` event was fired. Important: This
     * object is only partially typed and there are more properties and methods
     * on it!
     */
    get h5pObject(): IH5P;
    private set h5pObject(value);
    /**
     * The window object in which the H5P object exists and is rendered in. This
     * is the iframe's contentWindow or the parent's window, depending on the
     * embed type.
     */
    get h5pWindow(): any;
    private set h5pWindow(value);
    /**
     * Called when the component needs to load data about content. The endpoint
     * called in here should call H5PPlayer.render() and send back the player
     * model.
     *
     * Should throw an error with a message in the message property if something
     * goes wrong.
     */
    get loadContentCallback(): (contentId: string, contextId?: string, asUserId?: string, readOnlyState?: boolean) => Promise<IPlayerModel>;
    set loadContentCallback(callback: (contentId: string, contextId?: string, asUserId?: string, readOnlyState?: boolean) => Promise<IPlayerModel>);
    /**
     * Indicates changes to which attributes should trigger calls to
     * attributeChangedCallback.
     * @memberof H5PPlayerComponent
     */
    static get observedAttributes(): string[];
    constructor();
    private static template;
    private playerModel;
    private privateLoadContentCallback;
    private resizeObserver;
    private root;
    private h5pInstanceInternal;
    private h5pObjectInternal;
    private h5pWindowInternal;
    private static initTemplate;
    /**
     * Called when one of the attributes in observedAttributes changes.
     */
    attributeChangedCallback(name: string, oldVal: any, newVal: any): Promise<void>;
    /**
     * Called when the component is added to the DOM.
     */
    connectedCallback(): void;
    /**
     * Called when the component is removed from the DOM.
     */
    disconnectedCallback(): void;
    /**
     * Returns the copyright notice in HTML that you can insert somewhere to
     * display it. Undefined if there is no copyright information.
     */
    getCopyrightHtml(): string | undefined;
    /**
     * @returns true if there is copyright information to be displayed.
     */
    hasCopyrightInformation(): boolean;
    /**
     * Asks the H5P content to resize itself inside the dimensions of the
     * container.
     *
     * Has no effect until the H5P object has fully initialized.
     */
    resize(): void;
    /**
     * Displays the copyright notice in the regular H5P way.
     */
    showCopyright(): void;
    /**
     * Called when any H5P content signals that it was initialized
     */
    private onContentInitialized;
    private onxAPI;
    /**
     * Displays content.
     * @param {string} contentId
     */
    private render;
    /**
     * Creates a new DOM for the H5P using a div as container.
     */
    private renderDiv;
    /**
     * Creates a new DOM for the H5P using an iframe as container.
     * @param {IPlayerModel} playerModel
     */
    private renderIframe;
}
