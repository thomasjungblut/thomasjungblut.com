"use strict";(self.webpackChunkgatsby_starter_blog=self.webpackChunkgatsby_starter_blog||[]).push([[989],{8771:function(e,t,l){var a=l(7294),n=l(1883),r=l(8032);t.Z=()=>{var e,t,l;const i=(0,n.useStaticQuery)("2270107033"),m=null===(e=i.site.siteMetadata)||void 0===e?void 0:e.author,o=null==i||null===(t=i.avatar)||void 0===t||null===(l=t.childImageSharp)||void 0===l?void 0:l.gatsbyImageData;return a.createElement("div",{className:"bio"},o&&a.createElement(r.G,{image:o,alt:(null==m?void 0:m.name)||"",className:"bio-avatar",imgStyle:{borderRadius:"50%"}}),(null==m?void 0:m.name)&&a.createElement("div",{className:"bio-summary"},a.createElement("p",null,(null==m?void 0:m.summary)||null)))}},4982:function(e,t,l){l.r(t);var a=l(7294),n=l(1883),r=l(8771),i=l(8678),m=l(8183);t.default=e=>{var t;let{data:l,location:o}=e;const s=l.markdownRemark,c=(null===(t=l.site.siteMetadata)||void 0===t?void 0:t.title)||"Title",{previous:u,next:d}=l,p=l.markdownRemark.timeToRead;return a.createElement(i.Z,{location:o,title:c},a.createElement(m.Z,{title:s.frontmatter.title,description:s.frontmatter.description||s.excerpt}),a.createElement("article",{className:"blog-post",itemScope:!0,itemType:"http://schema.org/Article"},a.createElement("header",null,a.createElement("h1",{itemProp:"headline"},s.frontmatter.title),a.createElement("div",null,a.createElement("p",null,s.frontmatter.date,a.createElement("span",{className:"gr"},"·"),p," min read"))),a.createElement("section",{dangerouslySetInnerHTML:{__html:s.html},itemProp:"articleBody"}),a.createElement("hr",null),a.createElement("footer",null,a.createElement(r.Z,null))),a.createElement("nav",{className:"blog-post-nav"},a.createElement("ul",{style:{display:"flex",flexWrap:"wrap",justifyContent:"space-between",listStyle:"none",padding:0}},a.createElement("li",null,u&&a.createElement(n.Link,{to:u.fields.slug,rel:"prev"},"← ",u.frontmatter.title)),a.createElement("li",null,d&&a.createElement(n.Link,{to:d.fields.slug,rel:"next"},d.frontmatter.title," →")))))}}}]);
//# sourceMappingURL=component---src-templates-blog-post-js-531b744c6663b3a1de10.js.map