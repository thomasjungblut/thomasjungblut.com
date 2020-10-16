import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import Image from "gatsby-image"

import Layout from "../components/layout"
import SEO from "../components/seo"

const NotFoundPage = ({ location }) => {
  const data = useStaticQuery(graphql`
    query FourOhFourQuery {
      img: file(absolutePath: { regex: "/i-find-your-lack-of-navigation-disturbing.jpg/" }) {
        childImageSharp {
          fluid(maxWidth: 864, maxHeight: 768) {
            ...GatsbyImageSharpFluid
          }
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
          <Image fluid={data.img.childImageSharp.fluid} alt="" />
        )}
      </p>
    </Layout>
  )
}

export default NotFoundPage
