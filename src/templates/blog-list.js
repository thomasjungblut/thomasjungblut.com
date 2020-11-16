import React from "react"
import { Link, graphql } from "gatsby"

import Bio from "../components/bio"
import Layout from "../components/layout"
import SEO from "../components/seo"

const BlogIndex = ({ data, location, pageContext }) => {
  const siteTitle = data.site.siteMetadata?.title || `Title`
  const posts = data.allMarkdownRemark.nodes
  const currentPage = pageContext.currentPage
  const numPages = pageContext.numPages
  const isFirstPage = currentPage === 0
  const isLastPage = currentPage === numPages - 1

  if (posts.length === 0) {
    return (
      <Layout location={location} title={siteTitle}>
        <SEO title="All posts" />
        <Bio />
        <p>
          No blog posts found.
        </p>
      </Layout>
    )
  }

  return (
    <Layout location={location} title={siteTitle}>
      <SEO title={isFirstPage ? "Home" : "Page " + currentPage} />
      {isFirstPage && <Bio />}
      <div className="blog-list">
        <ol style={{ listStyle: `none` }}>
          {posts.map(post => {
            const title = post.frontmatter.title || post.fields.slug

            return (
              <li key={post.fields.slug}>
                <article
                  className="post-list-item"
                  itemScope
                  itemType="http://schema.org/Article"
                >
                  <header>
                    <h2>
                      <Link to={post.fields.slug} itemProp="url">
                        <span itemProp="headline">{title}</span>
                      </Link>
                    </h2>
                    <small>{post.frontmatter.date}</small>
                  </header>
                  <section>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: post.frontmatter.description || post.excerpt,
                      }}
                      itemProp="description"
                    />
                  </section>
                </article>
              </li>
            )
          })}
        </ol>
      </div>
      <hr />
      <div className="pagination">
        <ul>
          {!isFirstPage && (
            <Link to={currentPage - 1 === 0 ? '/' : `/page/${currentPage - 1}`} rel="prev">
              ← Previous Page
            </Link>
          )}
          {
            Array.from({ length: numPages }, (_, i) => (
              <li
                key={`pagination-number-${i}`}
                style={{
                  margin: 0,
                }}
              >
                <Link to={`${i === 0 ? '/' : `/page/${i}`}`} className={`${i === currentPage ? 'active' : 'inactive'}`}>
                  {`${i === 0 ? 'Home' : `${i}`}`}
                </Link>
              </li>
            ))
          }
          {!isLastPage && (
            <Link to={`/page/${currentPage + 1}`} rel="next">
              Next Page →
            </Link>
          )}
        </ul>
      </div>
    </Layout>
  )
}

export default BlogIndex

export const pageQuery = graphql`
  query blogPageQuery($skip: Int!, $limit: Int!) {
    site {
      siteMetadata {
        title
      }
    }
    allMarkdownRemark(
      sort: { fields: [frontmatter___date], order: DESC }
      limit: $limit
      skip: $skip) {
      nodes {
        excerpt(pruneLength: 250)
        fields {
          slug
        }
        frontmatter {
          date(formatString: "Do MMMM YYYY")
          title
          description
        }
      }
    }
  }
`
