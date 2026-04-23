import { QuartzComponent, QuartzComponentConstructor } from "./types"
import style from "./styles/graph.scss"

const Graph: QuartzComponent = (props) => {
  const { fileData } = props
  if (!fileData.slug) return null

  return (
    <div class="graph">
      <h3>Graph</h3>
      <div class="graph-outer">
        <div class="graph-container" data-local-graph data-cfg={JSON.stringify({
          drag: true,
          zoom: true,
          depth: 1,
          scale: 1.1,
          repelForce: 0.5,
          centerForce: 0.3,
          linkDistance: 30,
          fontSize: 0.6,
          opacityScale: 1,
          showTags: true,
          removeTags: [],
          focusOnHover: true,
          enableRadial: false,
        })}></div>
      </div>
    </div>
  )
}

Graph.css = style

const graphScript = `
(function() {
  async function loadD3() {
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

  async function renderAll() {
    var d3 = await loadD3().catch(function() { return null; });
    if (!d3) return;

    var containers = document.getElementsByClassName("graph-container");
    if (!containers || containers.length === 0) return;

    var currentSlug = window.location.pathname.replace(/\\//, "").replace(/\\.html$/, "") || "index";

    async function renderLocal(container, slug) {
      var cfg = {};
      try {
        cfg = JSON.parse(container.dataset.cfg || "{}");
      } catch (e) {
        cfg = { depth: 1 };
      }

      var depth = cfg.depth || 1;

      try {
        var res = await fetch("/static/contentIndex.json");
        var data = await res.json();
        renderGraph(container, data, slug, depth, d3, cfg);
      } catch (e) {
        console.error("Failed to load graph:", e);
      }
    }

    function renderGraph(container, indexData, slug, depth, d3, cfg) {
      container.innerHTML = "";

      var rect = container.getBoundingClientRect();
      var width = rect.width || 300;
      var height = rect.height || 200;
      if (height < 150) height = 150;

      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("width", "100%");
      svg.setAttribute("height", "100%");
      svg.setAttribute("viewBox", "0 0 " + width + " " + height);

      var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      var gLinks = document.createElementNS("http://www.w3.org/2000/svg", "g");
      var gNodes = document.createElementNS("http://www.w3.org/2000/svg", "g");

      g.appendChild(gLinks);
      g.appendChild(gNodes);
      svg.appendChild(g);
      container.appendChild(svg);

      var fullSlug = slug;
      var nodeId = fullSlug.replace(/\\//, "").replace(/\\/index$/, "");

      var links = [];
      for (var key in indexData) {
        if (!indexData[key].links) continue;
        var source = key.replace(/^\\//, "").replace(/\\.html$/, "").replace(/\\/index$/, "");
        for (var i = 0; i < indexData[key].links.length; i++) {
          var target = indexData[key].links[i].replace(/^\\//, "").replace(/\\.html$/, "");
          links.push({ source: source, target: target });
        }
      }

      var neighbourhood = new Set([nodeId]);
      var queue = [nodeId];
      var visited = new Set([nodeId]);

      for (var d = 0; d < depth && queue.length > 0; d++) {
        var nextQueue = [];
        for (var qi = 0; qi < queue.length; qi++) {
          var curr = queue[qi];
          for (var li = 0; li < links.length; li++) {
            var link = links[li];
            if (link.source === curr && !visited.has(link.target)) {
              visited.add(link.target);
              nextQueue.push(link.target);
              neighbourhood.add(link.target);
            }
            if (link.target === curr && !visited.has(link.source)) {
              visited.add(link.source);
              nextQueue.push(link.source);
              neighbourhood.add(link.source);
            }
          }
        }
        queue = nextQueue;
      }

      var nodes = [];
      for (var key in indexData) {
        var id = key.replace(/^\\//, "").replace(/\\.html$/, "").replace(/\\/index$/, "");
        if (neighbourhood.has(id)) {
          var linkCount = links.filter(function(l) { return l.source === id || l.target === id; }).length;
          nodes.push({
            id: id,
            title: indexData[key].title || id,
            linkCount: linkCount,
            radius: 3 + Math.sqrt(linkCount) * 2
          });
        }
      }

      var validLinks = links.filter(function(l) {
        return neighbourhood.has(l.source) && neighbourhood.has(l.target);
      });

      var nodeMap = new Map();
      nodes.forEach(function(n, i) {
        n.x = Math.random() * width;
        n.y = Math.random() * height;
        nodeMap.set(n.id, n);
      });

      var linkData = validLinks.map(function(l) {
        return {
          source: nodeMap.get(l.source),
          target: nodeMap.get(l.target)
        };
      }).filter(function(l) { return l.source && l.target; });

      if (nodes.length === 0) {
        container.innerHTML = "<p style='padding:1rem;color:var(--tertiary)'>No connected pages found.</p>";
        return;
      }

      var simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(linkData).distance(cfg.linkDistance || 30))
        .force("charge", d3.forceManyBody().strength(-100 * (cfg.repelForce || 0.5)))
        .force("center", d3.forceCenter(width / 2, height / 2).strength(cfg.centerForce || 0.3))
        .force("collide", d3.forceCollide(function(n) { return n.radius + 2; }));

      var linkSel = gLinks.selectAll("line")
        .data(linkData)
        .enter().append("line")
        .attr("stroke", "var(--midground-fainter)")
        .attr("stroke-width", 1)
        .attr("opacity", 0.6);

      var nodeSel = gNodes.selectAll("g")
        .data(nodes)
        .enter().append("g")
        .attr("cursor", "pointer");

      nodeSel.append("circle")
        .attr("r", function(d) { return d.radius; })
        .attr("fill", function(d) { return d.id === nodeId ? "var(--secondary)" : "var(--primary)"; })
        .attr("stroke", "var(--surface)")
        .attr("stroke-width", 1);

      nodeSel.append("title")
        .text(function(d) { return d.title; });

      nodeSel.on("click", function(event, d) {
        var path = d.id === "index" ? "/" : "/" + d.id + ".html";
        window.spaNavigate(new URL(path, window.location.toString()));
      });

      nodeSel.on("mouseenter", function(event, d) {
        d3.select(this).select("circle").attr("fill", "var(--accent)");
      });

      nodeSel.on("mouseleave", function(event, d) {
        d3.select(this).select("circle").attr("fill", d.id === nodeId ? "var(--secondary)" : "var(--primary)");
      });

      if (cfg.drag !== false) {
        nodeSel.call(d3.drag()
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
      }

      simulation.on("tick", function() {
        linkSel
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

        nodeSel.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
      });

      if (cfg.zoom !== false) {
        var zoom = d3.zoom()
          .scaleExtent([0.25, 4])
          .on("zoom", function(event) {
            g.setAttribute("transform", event.transform);
          });
        d3.select(svg).call(zoom);
      }
    }

    for (var i = 0; i < containers.length; i++) {
      (function(container) {
        renderLocal(container, currentSlug);
      })(containers[i]);
    }
  }

  document.addEventListener("nav", function() {
    renderAll();
  });

  renderAll();
})();
`

Graph.afterDOMLoaded = graphScript

export default (() => Graph) satisfies QuartzComponentConstructor