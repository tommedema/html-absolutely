const cheerio = require('cheerio')
const url = require('url')
const encodeUrl = require('encodeurl')

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
  const $ = cheerio.load(html, {
    lowerCaseTags: true,
    lowerCaseAttributeNames: true
  })

  // hrefs and srcs
  $('[href],[src]')
  .each((i, el) => {
    const href = el.attribs.href && el.attribs.href.trim()
    const src = el.attribs.src && el.attribs.src.trim()
    const attr = href ? 'href' : (src ? 'src' : null)
    if (attr) {
      const val = el.attribs[attr]
      const encoded = encodeUrl(val)
      if (isProtolessPath(encoded)) {
        const resolved = url.resolve(resolveTo, encoded)
        $(el).attr(attr, resolved)
      }
    }
  })
  
  //style attr
  $('[style]')
  .each((i, el) => {
    if (el.attribs.style && el.attribs.style.trim()) {
      $(el).attr('style', rebaseStylesheetUrls(el.attribs.style, resolveTo))
    }
  })
  
  //style tags
  $('style')
  .each((i, el) => {
    const $el = $(el)
    $el.html(rebaseStylesheetUrls($el.html(), resolveTo))
  })
    
  return $.html({ decodeEntities: false })
}

// FIXME: move this to separate lib that is used by both `html-absolutely` and `html-embed-stylesheets`
function isProtolessPath (path) {
  const parsed = url.parse(path)
  return !parsed.protocol && parsed.pathname
}

// FIXME: move this to a separate lib that is used by both `html-absolutely` and `html-embed-stylesheets`
function rebaseStylesheetUrls (stylesheet, resolveTo) {
  const urlRegex = /url\(\s?["']?([^)'"]+)["']?\s?\).*/i
  
  let index = 0
  while((found = urlRegex.exec(stylesheet.substring(index))) !== null)
  {
    const rawSrc = found[1]
    const encodedSrc = encodeUrl(rawSrc.trim())
    if (isProtolessPath(encodedSrc)) {
      const resolvedSrc = url.resolve(resolveTo, encodedSrc)
      const foundIndex = found.input.indexOf(rawSrc)
      
      stylesheet =
        stylesheet.slice(0, index + foundIndex) +
        resolvedSrc +
        stylesheet.slice(index + foundIndex + rawSrc.length)
        
      index += resolvedSrc.length - rawSrc.length
    }
    index += found.index + rawSrc.length
  }
  
  return stylesheet
}

module.exports = absolutely
