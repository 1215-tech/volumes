import { type QuartzFilterPlugin } from "../types"

export const RemoveDrafts: QuartzFilterPlugin = () => ({
  name: "RemoveDrafts",
  shouldPublish(_ctx, [, vfile]) {
    const filePath = vfile.data.filePath ?? vfile.path ?? ""
    if (vfile.data.frontmatter?.publish === false) {
      return false
    }
    return !filePath.includes("drafts/") || filePath.includes("templates/")
  },
})
