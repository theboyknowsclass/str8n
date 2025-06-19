/**
 * TypeScript declaration file for SVG modules
 *
 * This file provides type definitions for importing SVG files as React components
 * in a TypeScript environment. It allows TypeScript to understand that any file
 * with a .svg extension can be imported and used as a React functional component
 * that accepts standard SVG props.
 */

declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';

  /**
   * SVG content imported as a React functional component
   *
   * This type definition allows SVG files to be imported and used as React components
   * that can accept standard SVG properties like width, height, fill, stroke, etc.
   *
   * @example
   * import Logo from './assets/logo.svg';
   *
   * // Usage in JSX
   * <Logo width={100} height={100} fill="#000000" />
   */
  const content: React.FC<SvgProps>;

  // Export the SVG component as the default export
  export default content;
}
