// Shim local: hace que "react" exista de verdad en node_modules, resolviendo
// a preact/compat — necesario porque framer-motion importa "react" de forma
// literal y Astro ejecuta un paso de prerender aislado que hace `import()`
// directo de node_modules, sin pasar por los alias de Vite en absoluto.
export * from "preact/compat";
export { default } from "preact/compat";
