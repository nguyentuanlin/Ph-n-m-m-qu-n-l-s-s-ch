import { Component, ReactNode } from 'react';
import type { IContentMetadata, IEditorModel } from '@lumieducation/h5p-server';
declare global {
    /**
     * Enables type checks for JSX.
     */
    namespace JSX {
        interface IntrinsicElements {
            'h5p-editor': {
                'content-id'?: string;
                'h5p-url'?: string;
                ref?: any;
            };
        }
    }
}
interface IH5PEditorUIProps {
    contentId: string;
    loadContentCallback: (contentId: string) => Promise<IEditorModel & {
        library?: string;
        metadata?: IContentMetadata;
        params?: any;
    }>;
    onLoaded?: (contentId: string, ubername: string) => void;
    onSaved?: (contentId: string, metadata: IContentMetadata) => void;
    onSaveError?: (errorMessage: string) => void;
    saveContentCallback: (contentId: string, requestBody: {
        library: string;
        params: any;
    }) => Promise<{
        contentId: string;
        metadata: IContentMetadata;
    }>;
}
export default class H5PEditorUI extends Component<IH5PEditorUIProps> {
    constructor(props: IH5PEditorUIProps);
    private h5pEditor;
    componentDidMount(): void;
    componentDidUpdate(): void;
    componentWillUnmount(): void;
    getSnapshotBeforeUpdate(): void;
    render(): ReactNode;
    /**
     * Call this method to save the current state of the h5p editor. This will
     * result in a call to the `saveContentCallback` that was passed in the
     * through the props.
     * @throws an error if there was a problem (e.g. validation error of the
     * content)
     */
    save(): Promise<{
        contentId: string;
        metadata: IContentMetadata;
    } | undefined>;
    private loadContentCallbackWrapper;
    private onEditorLoaded;
    private onSaved;
    private onSaveError;
    private registerEvents;
    private saveContentCallbackWrapper;
    private setServiceCallbacks;
    private unregisterEvents;
}
export {};
