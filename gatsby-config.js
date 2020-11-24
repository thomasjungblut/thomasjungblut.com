module.exports = {
  siteMetadata: {
    title: `Coding with Thomas`,
    author: {
      name: `Thomas Jungblut`,
      summary: `I'm Thomas Jungblut - welcome to my personal blog. Here you'll find a lot of posts around all the things I'm interested in writing about. 
                Big Data, Bulk Synchronous Parallel, MapReduce, Machine Learning, Clustering, Graph Theory, Natural Language Processing, Computer Science and Open Source in general.`,
    },
    description: ``,
    siteUrl: `https://blog.thomasjungblut.com/`,
    social: {
      twitter: `tjungblut`,
    },
  },
  plugins: [
    {
      resolve: `gatsby-plugin-pinterest-twitter-facebook`,
      options: {
        delayTimer: 1000,
        twitter: {
          enable: true,
          containerSelector: `.twitter-container`,
          handle: `tjungblut`,
          showFollowButton: true,
          showTimeline: false,
          showFollowerCount: false,
          timelineTweetCount: 1,
          width: null,
          height: null,
          noHeader: true,
          noFooter: true,
          noBorders: true,
          noScrollbar: true,
          transparent: true
        }
      }
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blog`,
        name: `blog`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/assets`,
        name: `assets`,
      },
    },    
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 630,
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          {
            resolve: `gatsby-remark-table-of-contents`,
            options: {
              exclude: "Table of Contents",
              tight: false,
              fromHeading: 1,
              toHeading: 6,
              className: "table-of-contents"
            },
          },
          `gatsby-remark-autolink-headers`,
          `gatsby-remark-prismjs`,
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
        ],
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    `gatsby-plugin-feed`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Gatsby Starter Blog`,
        short_name: `GatsbyJS`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `content/assets/favicon-256x256.png`,
      },
    },
    `gatsby-plugin-react-helmet`,
    `gatsby-plugin-sitemap`,
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ],
}
