import { pathToFileURL } from "node:url";
import path from "node:path";
export async function resolve(specifier, context, nextResolve) {
  if (
    ["playwright", "axe-core"].includes(specifier) &&
    process.env.QA_NODE_MODULES
  ) {
    return nextResolve(
      pathToFileURL(
        path.join(
          process.env.QA_NODE_MODULES,
          specifier,
          specifier === "playwright" ? "index.mjs" : "axe.js",
        ),
      ).href,
      context,
    );
  }
  return nextResolve(specifier, context);
}
