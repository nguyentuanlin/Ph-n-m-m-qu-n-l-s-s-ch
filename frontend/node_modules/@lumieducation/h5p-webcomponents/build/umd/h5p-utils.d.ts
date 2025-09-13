import type { IIntegration } from '@lumieducation/h5p-server';
/**
 * Merges the new IIntegration object with the global one.
 * @param newIntegration
 * @param contentId
 */
export declare function mergeH5PIntegration(newIntegration: IIntegration, contentId: string): void;
/**
 * Removes the data about the content from the global H5PIntegration object.
 * @param contentId
 */
export declare function removeUnusedContent(contentId: string): void;
