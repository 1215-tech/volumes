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
  vx: number
  vy: number
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
      x: Math.random() * 800,
      y: Math.random() * 600,
      vx: 0,
      vy: 0,
      radius: Math.min(4 + Math.sqrt(displayTitle.length) * 1.2, 12),
    })
  }

  const links: GraphLink[] = []
  for (const file of allFiles) {
    if (!file.slug || !file.links) continue
    const sourceSlug = file.slug as string
    const sourceIndex = nodeMap.get(sourceSlug)
    if (sourceIndex === undefined) continue

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

  for (let i = 0; i < iterations; i++) {
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

      const cx = width / 2
      const cy = height / 2
      const toCenterX = cx - node.x
      const toCenterY = cy - node.y
      const centerDist = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY)
      if (centerDist > 0) {
        fx += (toCenterX / centerDist) * 0.5
        fy += (toCenterY / centerDist) * 0.5
      }

      node.vx = (node.vx + fx * 0.1) * 0.85
      node.vy = (node.vy + fy * 0.1) * 0.85
      node.x += node.vx
      node.y += node.vy

      node.x = Math.max(node.radius, Math.min(width - node.radius, node.x))
      node.y = Math.max(node.radius, Math.min(height - node.radius, node.y))
    }

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
        source.vx += fx * 0.5
        source.vy += fy * 0.5
        target.vx -= fx * 0.5
        target.vy -= fy * 0.5
      }
    }
  }

  return nodes
}

function generateGraphJson(allFiles: QuartzPluginData[]): string {
  const { nodes, links } = buildGraphData(allFiles)
  const processedNodes = simulateForces(nodes, links, 800, 600, 100)

  const minX = Math.min(...processedNodes.map((n) => n.x))
  const maxX = Math.max(...processedNodes.map((n) => n.x))
  const minY = Math.min(...processedNodes.map((n) => n.y))
  const maxY = Math.max(...processedNodes.map((n) => n.y))

  const scale = Math.max(maxX - minX, maxY - minY) || 1
  const normalizedNodes = processedNodes.map((n) => ({
    id: n.id,
    title: n.title,
    slug: n.slug,
    x: ((n.x - minX) / scale) * 700 + 50,
    y: ((n.y - minY) / scale) * 500 + 50,
    radius: n.radius,
  }))

  return JSON.stringify({ nodes: normalizedNodes, links }, null, 0)
}

export const GraphMap: QuartzComponent = (props: QuartzComponentProps) => {
  const { fileData, allFiles } = props
  const graphJson = generateGraphJson(allFiles)

  const cssClasses: readonly string[] = fileData.frontmatter?.cssclasses ?? []
  const classes = [PREVIEWABLE_CLASS, ...cssClasses].join(" ")

  return (
    <div className={classes}>
      <article data-use-dropcap="false">
        <p>This graph shows {allFiles.length} interconnected pages.</p>
        <div id="graph-map-container">
          <div
            id="graph-data"
            data-graph={graphJson}
            style={{ display: "none" }}
          />
          <svg id="graph-svg" width="100%" height="600" viewBox="0 0 800 600">
            <g id="graph-links" />
            <g id="graph-nodes" />
          </svg>
          <div id="graph-controls">
            <button id="zoom-in" aria-label="Zoom in">+</button>
            <button id="zoom-out" aria-label="Zoom out">-</button>
            <button id="reset-view" aria-label="Reset view">Reset</button>
          </div>
          <div id="graph-tooltip" className="hidden" />
        </div>
      </article>
    </div>
  )
}

GraphMap.css = style
GraphMap.afterDOMLoaded = `const graphData=document.getElementById("graph-data");if(!graphData)return;const data=JSON.parse(graphData.dataset.graph);const svg=document.getElementById("graph-svg");const nodesGroup=document.getElementById("graph-nodes");const linksGroup=document.getElementById("graph-links");const tooltip=document.getElementById("graph-tooltip");let scale=1,translateX=0,translateY=0;const nodeElements=[],linkElements=[];for(const link of data.links){const line=document.createElementNS("http://www.w3.org/2000/svg","line");line.setAttribute("stroke","var(--midground-fainter)");line.setAttribute("stroke-width","1");linksGroup.appendChild(line);linkElements.push(line)}for(const node of data.nodes){const circle=document.createElementNS("http://www.w3.org/2000/svg","circle");circle.setAttribute("cx",node.x);circle.setAttribute("cy",node.y);circle.setAttribute("r",node.radius);circle.setAttribute("fill","var(--primary)");circle.style.cursor="pointer";circle.addEventListener("mouseenter",(e)=>{tooltip.textContent=node.title;tooltip.classList.remove("hidden");const rect=svg.getBoundingClientRect();tooltip.style.left=(e.clientX-rect.left+10)+"px";tooltip.style.top=(e.clientY-rect.top-10)+"px"});circle.addEventListener("mouseleave",()=>tooltip.classList.add("hidden"));circle.addEventListener("click",()=>window.location.href=node.slug);nodesGroup.appendChild(circle);nodeElements.push(circle)}function render(){const t="translate("+translateX+","+translateY+") scale("+scale+")";nodesGroup.setAttribute("transform",t);linksGroup.setAttribute("transform",t);for(let i=0;i<data.nodes.length;i++){const node=data.nodes[i];const link=data.links[i];if(linkElements[i]){const source=data.nodes.find(n=>n.id===link.source);const target=data.nodes.find(n=>n.id===link.target);if(source&&target){linkElements[i].setAttribute("x1",source.x);linkElements[i].setAttribute("y1",source.y);linkElements[i].setAttribute("x2",target.x);linkElements[i].setAttribute("y2",target.y)}}}}render();document.getElementById("zoom-in")?.addEventListener("click",()=>{scale*=1.2;render()});document.getElementById("zoom-out")?.addEventListener("click",()=>{scale/=1.2;render()});document.getElementById("reset-view")?.addEventListener("click",()=>{scale=1;translateX=0;translateY=0;render()});let isDragging=false,startX,startY;svg.addEventListener("mousedown",(e)=>{isDragging=true;startX=e.clientX-translateX;startY=e.clientY-translateY});svg.addEventListener("mousemove",(e)=>{if(!isDragging)return;translateX=e.clientX-startX;translateY=e.clientY-startY;render()});svg.addEventListener("mouseup",()=>isDragging=false);svg.addEventListener("mouseleave",()=>isDragging=false)`

export { mapSlug, mapTitle, mapDescription }
export default GraphMap