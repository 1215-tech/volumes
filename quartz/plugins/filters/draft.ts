import { type QuartzFilterPlugin } from "../types"

export const RemoveDrafts: QuartzFilterPlugin = () => ({
  name: "RemoveDrafts",
  shouldPublish(_ctx, [, vfile]) {
    const filePath = vfile.data.filePath ?? vfile.path ?? ""
    const publish = vfile.data.frontmatter?.publish
    if (publish === false || publish === "false") {
      return false
    }
    return !filePath.includes("drafts/") || filePath.includes("templates/")
  },
})
