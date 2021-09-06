const visit = require("unist-util-visit")
const unified = require("unified")
const markdown = require("remark-parse")

module.exports = ({ markdownAST }) => {
  visit(markdownAST, "code", (node) => {
    // Skip if not GRID
    if (!node.lang || node.lang.indexOf("grid") === -1) return
    const className = "gr-imagesgrid"
    
    const meta = node.lang + (node.meta ? " " + node.meta : "")
    let [, columnsCount, figcaption] = meta.split("|")

    if (!columnsCount) {
      columnsCount = 1
    }

    // Get the grid
    const contentAST = unified().use(markdown).parse(node.value)

    // For every image create node
    let imagesNodes = []
    visit(contentAST, "image", (node) => {
      imagesNodes.push(node)
    })

    // Create Captions for images
    const figcaptionNode = figcaption && {
      type: "paragraph",
      data: {
        hName: "figcaption",
        hProperties: {
          className: `${className}-figcaption`,
        },
      },
      children: [
        {
          type: "text",
          value: figcaption,
        },
      ],
    }

    // Create Grid with image childs
    const gridNode = {
      type: "parent",
      data: {
        hName: "div",
        hProperties: {
          className: `${className}-grid`,
          style: `
            grid-template-columns: repeat(auto-fill, minmax(${
              Math.floor(100 / columnsCount) - 2
            }%, 1fr));
          `,
        },
      },
      children: imagesNodes,
    }

    // Return grid nodes
    node.type = "paragraph"
    node.children = [gridNode, ...(figcaptionNode ? [figcaptionNode] : [])]
    node.data = {
      hName: "figure",
      hProperties: {
        className: className,
      },
    }
  })

  return markdownAST
}