import type { ILink } from '@comunica/types';

/**
 * Test a given link to determine whether it should be accepted or not.
 * @param {ILink} link The link to be tested.
 * @returns {boolean} True if the link should be considered, false if it should be discarded.
 */
export type LinkFilterType = (link: ILink) => boolean;
