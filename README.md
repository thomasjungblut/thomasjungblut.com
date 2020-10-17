This repo drives my blog at [https://blog.thomasjungblut.com](https://blog.thomasjungblut.com).

## Develop

**Start developing**

If you haven't installed Gatsby-cli so far, here's the command:

```shell
npm install -g gatsby-cli
```

To start running the SPA locally you just have to:

```shell
gatsby develop
```

**Open the source code and start editing**

Your site is now running at `http://localhost:8000`!

_Note: You'll also see a second link: _`http://localhost:8000/___graphql`_. This is a tool you can use to experiment with querying your data. Learn more about using this tool in the [Gatsby tutorial]
(https://www.gatsbyjs.com/tutorial/part-five/#introducing-graphiql)._

## Deploy
  
Deployment is done via GitHub Actions, the [whole workflow can be found here](https://github.com/thomasjungblut/thomasjungblut.com/blob/main/.github/workflows/publish.yml). It makes use of the `enriikke/gatsby-gh-pages-action@v2` action to webpack everything and push to the `gh-pages` branch where it goes the usual way of a GitHub Pages application.

