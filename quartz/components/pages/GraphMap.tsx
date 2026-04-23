import { PREVIEWABLE_CLASS } from "../constants"
import type { QuartzComponent, QuartzComponentProps } from "../types"
import { type FullSlug } from "../../util/path"
import type { QuartzPluginData } from "../../plugins/vfile"
import style from "../styles/graphMap.scss"

interface GraphNode {
  id: string
  title: string
  slug: string
  x: number
  y: number
  radius: number
}

interface GraphLink {
  source: string
  target: string
}

const mapSlug = "map" as FullSlug
const mapTitle = "Knowledge Graph"
const mapDescription = "An interactive graph map of all pages on turntrout.com."

function buildGraphData(allFiles: QuartzPluginData[]): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = []
  const nodeMap = new Map<string, number>()

  for (const file of allFiles) {
    if (!file.slug || !file.frontmatter?.title) continue
    const slug = file.slug as string
    const title = file.frontmatter.title as string
    const displayTitle = typeof title === "string" ? title : ""

    nodeMap.set(slug, nodes.length)
    nodes.push({
      id: slug,
      title: displayTitle,
      slug: file.slug as string,
      x: 0,
      y: 0,
      radius: Math.min(4 + Math.sqrt(displayTitle.length) * 1.2, 12),
    })
  }

  const links: GraphLink[] = []
  for (const file of allFiles) {
    if (!file.slug || !file.links) continue
    const sourceSlug = file.slug as string

    for (const link of file.links) {
      const targetSlug = link as string
      if (nodeMap.has(targetSlug) && targetSlug !== sourceSlug) {
        links.push({ source: sourceSlug, target: targetSlug })
      }
    }
  }

  return { nodes, links }
}

function simulateForces(
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number,
  iterations: number,
): GraphNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))

  // Initialize positions randomly
  for (const node of nodes) {
    node.x = Math.random() * width
    node.y = Math.random() * height
  }

  for (let i = 0; i < iterations; i++) {
    // Apply repulsion between all nodes
    for (const node of nodes) {
      let fx = 0
      let fy = 0

      for (const other of nodes) {
        if (other.id === node.id) continue
        const dx = node.x - other.x
        const dy = node.y - other.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const repulsion = (100 * (node.radius + other.radius)) / dist
        fx += (dx / dist) * repulsion
        fy += (dy / dist) * repulsion
      }

      // Center gravity
      const cx = width / 2
      const cy = height / 2
      const toCenterX = cx - node.x
      const toCenterY = cy - node.y
      const centerDist = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY)
      if (centerDist > 0) {
        fx += (toCenterX / centerDist) * 0.5
        fy += (toCenterY / centerDist) * 0.5
      }

      const vx = (node.x + fx * 0.1) * 0.85
      const vy = (node.y + fy * 0.1) * 0.85
      node.x = Math.max(node.radius, Math.min(width - node.radius, vx))
      node.y = Math.max(node.radius, Math.min(height - node.radius, vy))
    }

    // Spring forces along links
    for (const link of links) {
      const source = nodeMap.get(link.source)
      const target = nodeMap.get(link.target)
      if (!source || !target) continue

      const dx = target.x - source.x
      const dy = target.y - source.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const idealLength = 80
      const spring = (dist - idealLength) * 0.05

      if (dist > 0) {
        const fx = (dx / dist) * spring
        const fy = (dy / dist) * spring
        source.x += fx * 0.5
        source.y += fy * 0.5
        target.x -= fx * 0.5
        target.y -= fy * 0.5
      }
    }
  }

  return nodes
}

export const GraphMap: QuartzComponent = (props: QuartzComponentProps) => {
  const { fileData, allFiles } = props
  const { nodes, links } = buildGraphData(allFiles)
  const processedNodes = simulateForces(nodes, links, 800, 600, 100)

  // Normalize positions to fit in viewBox
  const minX = Math.min(...processedNodes.map((n) => n.x))
  const maxX = Math.max(...processedNodes.map((n) => n.x))
  const minY = Math.min(...processedNodes.map((n) => n.y))
  const maxY = Math.max(...processedNodes.map((n) => n.y))

  const scale = Math.max(maxX - minX, maxY - minY) || 1
  const normalizedNodes = processedNodes.map((n) => ({
    ...n,
    x: ((n.x - minX) / scale) * 700 + 50,
    y: ((n.y - minY) / scale) * 500 + 50,
  }))

  const nodeMap = new Map(normalizedNodes.map((n) => [n.id, n]))
  const nodeElements = normalizedNodes.map((node) => (
    <circle
      key={node.id}
      cx={node.x}
      cy={node.y}
      r={node.radius}
      fill="var(--primary)"
      style={{ cursor: "pointer" }}
      data-title={node.title}
      data-slug={node.slug}
    />
   ))

  const linkElements = links
    .map((link) => {
      const source = nodeMap.get(link.source)
      const target = nodeMap.get(link.target)
      if (!source || !target) return null
      return (
        <line
          key={`${link.source}-${link.target}`}
          x1={source.x}
          y1={source.y}
          x2={target.x}
          y2={target.y}
          stroke="var(--midground-fainter)"
          strokeWidth={1}
        />
      )
    })
    .filter(Boolean)

  const cssClasses: readonly string[] = fileData.frontmatter?.cssclasses ?? []
  const classes = [PREVIEWABLE_CLASS, ...cssClasses].join(" ")

  return (
    <div className={classes}>
      <article data-use-dropcap="false">
        <div id="graph-map-container">
          <svg id="graph-svg" width="100%" height="600" viewBox="0 0 800 600">
            <g id="graph-links">{linkElements}</g>
            <g id="graph-nodes">{nodeElements}</g>
          </svg>
          <div id="graph-tooltip" className="hidden" />
        </div>
      </article>
    </div>
  )
}

GraphMap.css = style

const graphScript = `
(function() {
  var nodes = document.querySelectorAll("#graph-nodes circle");
  var tooltip = document.getElementById("graph-tooltip");
  var svg = document.getElementById("graph-svg");
  
  for (var i = 0; i < nodes.length; i++) {
    var circle = nodes[i];
    var title = circle.getAttribute("data-title");
    var slug = circle.getAttribute("data-slug");
    
    circle.addEventListener("mouseenter", function(e) {
      tooltip.textContent = title;
      tooltip.classList.remove("hidden");
      var rect = svg.getBoundingClientRect();
      tooltip.style.left = (e.clientX - rect.left + 10) + "px";
      tooltip.style.top = (e.clientY - rect.top - 10) + "px";
    });
    
    circle.addEventListener("mouseleave", function() {
      tooltip.classList.add("hidden");
    });
    
    circle.addEventListener("click", function() {
      window.location.href = slug;
    });
  }
})();
`

GraphMap.afterDOMLoaded = graphScript

export { mapSlug, mapTitle, mapDescription }
export default GraphMap