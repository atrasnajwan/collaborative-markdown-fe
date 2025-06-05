/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'rehype-add-classes' {
  import { Plugin } from 'unified';
  const rehypeAddClasses: Plugin;
  export default rehypeAddClasses;
}

declare module 'rehype-autolink-headings' {
  import { Plugin } from 'unified';
  const rehypeAutolinkHeadings: Plugin;
  export default rehypeAutolinkHeadings;
}

declare module 'rehype-slug' {
  import { Plugin } from 'unified';
  const rehypeSlug: Plugin;
  export default rehypeSlug;
} 