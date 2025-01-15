declare module '*.css' {
  const styles: { [className: string]: string }
  export default styles
}

declare module 'postcss-import' {
  const plugin: any
  export default plugin
}

declare module 'tailwindcss' {
  const plugin: any
  export default plugin
} 