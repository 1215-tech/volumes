import { PREVIEWABLE_CLASS } from "../constants"
import type { QuartzComponent, QuartzComponentProps } from "../types"
import { type FullSlug } from "../../util/path"
import style from "../styles/graphMap.scss"

const mapSlug = "map" as FullSlug
const mapTitle = "Knowledge Graph"
const mapDescription = "An interactive graph map of all pages on turntrout.com."

export const GraphMap: QuartzComponent = (_props: QuartzComponentProps) => {
  const cssClasses: readonly string[] = _props.fileData.frontmatter?.cssclasses ?? []
  const classes = [PREVIEWABLE_CLASS, ...cssClasses].join(" ")

  return (
    <div className={classes}>
      <article data-use-dropcap="false">
        <div id="graph-container" data-enable-drag data-enable-zoom />
      </article>
    </div>
  )
}

GraphMap.css = style

const graphScript = `
// Dynamically load d3 from CDN
(async function() {
  function loadD3() {
    return new Promise(function(resolve, reject) {
      if (window.d3 && window.d3.forceSimulation) {
        resolve(window.d3);
        return;
      }
      var script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/d3@7";
      script.onload = function() { resolve(window.d3); };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  try {
    var d3 = await loadD3();
  } catch (e) {
    console.error("Failed to load d3:", e);
    return;
  }

  var container = document.getElementById("graph-container");
  if (!container) return;
  if (!container) return;

  var fullGraph = false;
  var currentSlug = window.location.pathname.replace(/\\//, "").replace(/\\.html$/, "") || "index";
  if (!currentSlug) currentSlug = "index";

  var svg, gLinks, gNodes, simulation, nodesData, linksData;
  var width = 800, height = 600;
  var scale = 1, translateX = 0, translateY = 0;

  async function fetchData() {
    try {
      var res = await fetch("/static/contentIndex.json");
      var data = await res.json();
      return data;
    } catch (e) {
      console.error("Failed to load graph data:", e);
      return null;
    }
  }

  function simplifySlug(slug) {
    return slug.replace(/^\\//, "").replace(/\\/index$/, "").replace(/\\.html$/, "");
  }

  function buildGraphData(indexData, slug, full) {
    var nodes = [], links = [];
    var validLinks = new Set(Object.keys(indexData));

    for (var key in indexData) {
      if (!indexData[key].links) continue;
      var source = simplifySlug(key);
      for (var i = 0; i < indexData[key].links.length; i++) {
        var target = simplifySlug(indexData[key].links[i]);
        if (validLinks.has(target) || target.startsWith("tags/")) {
          links.push({ source: source, target: target });
        }
      }
    }

    var neighbourhood = new Set();
    var queue = [slug];
    var visited = new Set();
    visited.add(slug);

    while (queue.length > 0 && !full) {
      var curr = queue.shift();
      neighbourhood.add(curr);

      for (var i = 0; i < links.length; i++) {
        var link = links[i];
        if (link.source === curr && !visited.has(link.target)) {
          visited.add(link.target);
          queue.push(link.target);
        }
        if (link.target === curr && !visited.has(link.source)) {
          visited.add(link.source);
          queue.push(link.source);
        }
      }
    }

    if (full) {
      for (var key in indexData) {
        neighbourhood.add(simplifySlug(key));
      }
    }

    for (var key in indexData) {
      var id = simplifySlug(key);
      if (neighbourhood.has(id)) {
        nodes.push({
          id: id,
          title: indexData[key].title || id,
          links: indexData[key].links?.length || 0
        });
      }
    }

    var finalLinks = [];
    for (var i = 0; i < links.length; i++) {
      if (neighbourhood.has(links[i].source) && neighbourhood.has(links[i].target)) {
        finalLinks.push(links[i]);
      }
    }

    return { nodes: nodes, links: finalLinks };
  }

  function renderGraph(indexData, slug, full) {
    container.innerHTML = "";

    var rect = container.getBoundingClientRect();
    width = rect.width || 800;
    height = Math.max(rect.height || 600, 400);

    var data = buildGraphData(indexData, slug, full);

    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", "0 0 " + width + " " + height);
    svg.style.display = "block";

    var defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = '<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="var(--midground-fainter)"/></marker>';
    svg.appendChild(defs);

    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gLinks = document.createElementNS("http://www.w3.org/2000/svg", "g");
    gNodes = document.createElementNS("http://www.w3.org/2000/svg", "g");

    g.appendChild(gLinks);
    g.appendChild(gNodes);
    svg.appendChild(g);

    if (container.dataset.enableZoom !== undefined) {
      var zoomG = document.createElementNS("http://www.w3.org/2000/svg", "g");
      zoomG.setAttribute("id", "zoom-group");
      zoomG.appendChild(g);
      svg.appendChild(zoomG);
    }

    container.appendChild(svg);

    var nodeMap = new Map();
    nodesData = data.nodes.map(function(n) {
      var radius = 3 + Math.sqrt(n.links || 1) * 1.5;
      var node = {
        id: n.id,
        title: n.title,
        radius: radius,
        x: Math.random() * width,
        y: Math.random() * height
      };
      nodeMap.set(n.id, node);
      return node;
    });

    linksData = data.links.map(function(l) {
      return {
        source: nodeMap.get(l.source),
        target: nodeMap.get(l.target)
      };
    }).filter(function(l) { return l.source && l.target; });

    simulation = d3.forceSimulation(nodesData)
      .force("link", d3.forceLink(linksData).distance(40))
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(function(d) { return d.radius + 2; }));

    function radius(d) { return d.radius; }

    var link = gLinks.selectAll("line")
      .data(linksData)
      .enter().append("line")
      .attr("stroke", "var(--midground-fainter)")
      .attr("stroke-width", 1)
      .attr("opacity", 0.6);

    var node = gNodes.selectAll("g")
      .data(nodesData)
      .enter().append("g")
      .attr("cursor", "pointer")
      .call(d3.drag()
        .on("start", function(event, d) {
          if (!event.active) simulation.alphaTarget(1).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", function(event, d) {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", function(event, d) {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    node.append("circle")
      .attr("r", radius)
      .attr("fill", function(d) { return d.id === slug ? "var(--secondary)" : "var(--primary)"; })
      .attr("stroke", "var(--surface)")
      .attr("stroke-width", 1.5);

    node.append("title")
      .text(function(d) { return d.title; });

    node.on("click", function(event, d) {
      var path = d.id === "index" ? "/" : "/" + d.id + ".html";
      window.spaNavigate(new URL(path, window.location.toString()));
    });

    node.on("mouseenter", function(event, d) {
      d3.select(this).select("circle").attr("fill", "var(--accent)");
    });

    node.on("mouseleave", function(event, d) {
      d3.select(this).select("circle").attr("fill", d.id === slug ? "var(--secondary)" : "var(--primary)");
    });

    simulation.on("tick", function() {
      link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

      node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
    });
  }

  fetchData().then(function(indexData) {
    if (!indexData) return;
    renderGraph(indexData, currentSlug, fullGraph);

    if (container.dataset.enableZoom !== undefined) {
      var zoom = d3.zoom()
        .scaleExtent([0.25, 4])
        .on("zoom", function(event) {
          var g = document.getElementById("zoom-group");
          if (g) g.setAttribute("transform", event.transform);
        });
      d3.select(svg).call(zoom);
    }
  });
})();
`

GraphMap.afterDOMLoaded = graphScript

export { mapSlug, mapTitle, mapDescription }
export default GraphMap