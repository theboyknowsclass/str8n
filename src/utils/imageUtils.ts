/**
 * Converts an image URI to a base64 data URL format.
 * If the image is already in data URL format, it returns the image as-is.
 *
 * @param image - The image URI or base64 string to convert
 * @param extension - The image file extension (defaults to 'jpeg')
 * @returns The image in base64 data URL format
 *
 * @example
 * ```typescript
 * const dataUrl = toBase64('path/to/image.jpg', 'jpeg');
 * // Returns: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'
 * ```
 */
export const toBase64 = (image: string, extension: string = 'jpeg') => {
  if (image.startsWith('data:image/')) {
    return image;
  }
  return 'data:image/' + extension + ';base64,' + image;
};

/**
 * Removes the data URL prefix from a base64 string if present
 * @param base64 - The base64 string that may include a data URL prefix
 * @returns The clean base64 string without the data URL prefix
 */
export const cleanBase64 = (base64: string): string => {
  return base64.replace(/^data:image\/\w+;base64,/, '');
};
