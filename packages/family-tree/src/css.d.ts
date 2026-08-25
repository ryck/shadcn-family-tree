// Lets this package typecheck on its own. Consumers get the same declaration
// from their bundler's types (`vite/client`, `next-env.d.ts`, and so on), which
// is why this file is not part of the registry item.
declare module "*.css"
