import React from "react"
import type { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const folders = [
  { name: "11Customs General", slug: "/11Customs-General" },
  { name: "Clippings", slug: "/Clippings" },
  { name: "Clothes", slug: "/Clothes" },
  { name: "Cooking", slug: "/Cooking" },
  { name: "Health and biohacking", slug: "/Health-and-biohacking" },
  { name: "Homelab, PC and EDC", slug: "/Homelab,-PC-and-EDC" },
  { name: "House & Apartment", slug: "/House--and--Apartment" },
  { name: "Literature", slug: "/Literature" },
  { name: "Scripts", slug: "/Scripts" },
  { name: "This Website", slug: "/This-Website" },
]

const FolderNav: QuartzComponent = (_props: QuartzComponentProps) => {
  return (
    <div id="folder-nav">
      <ul>
        {folders.map((folder) => (
          <li key={folder.slug}>
            <a href={`${folder.slug}/`} className="internal">
              {folder.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default (() => FolderNav) satisfies QuartzComponentConstructor