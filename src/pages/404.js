import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import { GatsbyImage } from "gatsby-plugin-image"

import Layout from "../components/layout"
import SEO from "../components/seo"

const NotFoundPage = ({ location }) => {
  const data = useStaticQuery(graphql`
    query FourOhFourQuery {
      img: file(relativePath: {eq: "i-find-your-lack-of-navigation-disturbing.jpg"}) {
        childImageSharp {
          gatsbyImageData(layout: FULL_WIDTH)
        }
      }
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  const siteTitle = data.site.siteMetadata.title

  return (
    <Layout location={location} title={siteTitle}>
      <SEO title="404: Not Found" />
      <h1>404: Not Found</h1>
      <p>
        {(
          <GatsbyImage image={data.img.childImageSharp.gatsbyImageData} />
        )}
      </p>
    </Layout>
  )
}

export default NotFoundPage
