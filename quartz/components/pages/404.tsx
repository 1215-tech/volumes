import React from "react"

import { cdnBaseUrl, PREVIEWABLE_CLASS } from "../constants"
import notFoundStyle from "../styles/404.scss"
import { QuartzComponent, QuartzComponentConstructor } from "../types"

const NotFound: QuartzComponent = () => {
  return (
    <article className={PREVIEWABLE_CLASS} data-use-dropcap="false">
      <div id="not-found-div">
        <div>
          <h1>404</h1>
          <p>
            This page doesn’t exist. 
          </p>
        </div>

        <img
          src={`/static/images/eye.png`}
        />
      </div>
    </article>
  )
}
NotFound.css = notFoundStyle

export default (() => NotFound) satisfies QuartzComponentConstructor
