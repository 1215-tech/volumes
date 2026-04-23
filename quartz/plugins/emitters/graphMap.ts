import GraphMap, { mapSlug, mapTitle, mapDescription } from "../../components/pages/GraphMap"
import { createListPageEmitter } from "./helpers"

export const GraphMapPage = createListPageEmitter({
  name: "GraphMapPage",
  pageBody: GraphMap,
  slug: mapSlug,
  title: mapTitle,
  description: mapDescription,
  frontmatter: {
    tags: ["website"],
    aliases: ["graph", "knowledge-graph", "network"],
  },
})