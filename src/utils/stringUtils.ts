/**
 * Truncates a string to a specified maximum length.
 * @param str The string to truncate.
 * @param maxLength The maximum allowed length.
 * @returns The truncated string.
 */
export const truncateString = (str: string | undefined | null, maxLength: number): string => {
    if (!str) return '';
    return str.length > maxLength ? str.substring(0, maxLength) : str;
};
