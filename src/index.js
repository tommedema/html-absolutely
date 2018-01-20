const cheerio = require('cheerio')
const url = require('url')
const encodeUrl = require('encodeurl')
const isProtoless = require('url-is-protoless')
const absCss = require('css-absolutely')
const srcset = require('srcset')

const cheerify = html => cheerio.load(html, {
  decodeEntities: true,
  lowerCaseTags: true,
  lowerCaseAttributeNames: true
})

/**
 * Insert html and receive back html with all relative urls resolved to an absolute url.
 * Ignores empty urls (e.g. `href=""`).
 * @param {string} html - the HTML to parse for stylesheets
 * @param {string} resolveTo - to which root url discovered urls should be resolved.
 * @returns {string} html - the html with absolute urls
 * @example
 * const absolutely = require('html-absolutely')
 * const { html } = absolutely(html, { resolveTo: 'https://www.example.com' })
 * console.log(html)
 */
function absolutely (html, resolveTo) {
  const $ = cheerify(html)

  // hrefs and srcs
  $('[href],[src]')
  .each((i, el) => {
    const href = el.attribs.href && el.attribs.href.trim()
    const src = el.attribs.src && el.attribs.src.trim()
    const attr = href ? 'href' : (src ? 'src' : null)
    if (attr) {
      const val = el.attribs[attr]
      const encoded = encodeUrl(val)
      if (isProtoless(encoded)) {
        const resolved = url.resolve(resolveTo, encoded)
        $(el).attr(attr, resolved)
      }
    }
  })
  
  //srcset attr
  $('[srcset]')
  .each((i, el) => {
    if (el.attribs.srcset && el.attribs.srcset.trim()) {
      $(el).attr('srcset', absSrcSet(el.attribs.srcset, resolveTo))
    }
  })
  
  //style attr
  $('[style]')
  .each((i, el) => {
    if (el.attribs.style && el.attribs.style.trim()) {
      $(el).attr('style', absCss(el.attribs.style, resolveTo))
    }
  })
  
  //style tags
  $('style')
  .each((i, el) => {
    const $el = $(el)
    $el.html(absCss($el.html(), resolveTo))
  })
    
  return $.html()
}

function absSrcSet(srcSetStr, resolveTo) {
  const parsed = srcset.parse(srcSetStr)
  for (let entry of parsed) {
    if (entry.url && isProtoless(entry.url)) {
      entry.url = url.resolve(resolveTo, entry.url)
    }
  }
  return srcset.stringify(parsed)
}

module.exports = absolutely

module.exports.cheerify = cheerify
