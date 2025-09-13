import { Component, ReactNode } from 'react';
import { IxAPIEvent, IH5PInstance, IH5P } from '@lumieducation/h5p-webcomponents';
import type { IPlayerModel } from '@lumieducation/h5p-server';
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'h5p-player': {
                'content-id'?: string;
                'context-id'?: string;
                'read-only-state'?: boolean;
                'as-user-id'?: string;
                ref?: any;
            };
        }
    }
}
interface IH5PPlayerUIProps {
    contentId: string;
    contextId?: string;
    asUserId?: string;
    readOnlyState?: boolean;
    loadContentCallback: (contentId: string, contextId?: string, asUserId?: string, readOnlyState?: boolean) => Promise<IPlayerModel>;
    onInitialized?: (contentId: string) => void;
    onxAPIStatement?: (statement: any, context: any, event: IxAPIEvent) => void;
}
export default class H5PPlayerUI extends Component<IH5PPlayerUIProps> {
    constructor(props: IH5PPlayerUIProps);
    private h5pPlayer;
    componentDidMount(): void;
    componentDidUpdate(): void;
    componentWillUnmount(): void;
    /**
     * The internal H5P instance object of the H5P content.
     *
     * Only available after the `initialized` event was fired. Important: This
     * object is only partially typed and there are more properties and methods
     * on it!
     */
    get h5pInstance(): IH5PInstance | undefined;
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
    get h5pObject(): IH5P | undefined;
    /**
     * Returns the copyright notice in HTML that you can insert somewhere to
     * display it. Undefined if there is no copyright information.
     */
    getCopyrightHtml(): string;
    getSnapshotBeforeUpdate(): void;
    /**
     * @returns true if there is copyright information to be displayed.
     */
    hasCopyrightInformation(): boolean;
    render(): ReactNode;
    /**
     * Displays the copyright notice in the regular H5P way.
     */
    showCopyright(): void;
    /**
     * Asks the H5P content to resize itself inside the dimensions of the
     * container.
     *
     * Has no effect until the H5P object has fully initialized.
     */
    resize(): void;
    private loadContentCallbackWrapper;
    private onInitialized;
    private onxAPIStatement;
    private registerEvents;
    private setServiceCallbacks;
    private unregisterEvents;
}
export {};
