import { QuartzTransformerPlugin } from "../viz.ts"
import { Root, Element, Text } from "hast"

function getTextContent(node: Element): string {
  let text = ""
  if (node.type === "text") {
    text += node.value
  } else if (node.type === "element") {
    for (const child of node.children) {
      if (child.type === "text") {
        text += child.value
      } else if (child.type === "element") {
        text += getTextContent(child)
      }
    }
  }
  return text
}

function setFirstLetterAttribute(tree: Root): void {
  const firstParagraph = tree.children.find(
    (child): child is Element =>
      child.type === "element" && child.tagName === "p" && getTextContent(child).trim().length > 0,
  )

  if (!firstParagraph) {
    return
  }

  const paragraphText = getTextContent(firstParagraph)
  const firstLetter = paragraphText.charAt(0)

  firstParagraph.properties = firstParagraph.properties || {}
  firstParagraph.properties["data-first-letter"] = firstLetter

  const firstTextNode = firstParagraph.children.find(
    (child): child is Text => child.type === "text",
  )
  if (!firstTextNode) return

  // Replace nbsp after first letter if present
  if (firstTextNode.value.charAt(1) === "\u00A0") {
    firstTextNode.value = `${firstTextNode.value.charAt(0)} ${firstTextNode.value.slice(2)}`
  }
}

export const SetDropcapFirstLetter: QuartzTransformerPlugin = () => {
  return {
    name: "setDropcapFirstLetter",
    htmlPlugins() {
      return [
        (tree: Root) => {
          setFirstLetterAttribute(tree)
          return tree
        },
      ]
    },
  }
}