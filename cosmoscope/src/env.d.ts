/// <reference types="vite/client" />

declare module "*.glsl" {
  const value: string;
  export default value;
}

declare module "*.mp3" {
  const src: string;
  export default src;
}
