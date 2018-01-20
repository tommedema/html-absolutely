/* eslint-disable no-unused-vars */
require('should')
require('loud-rejection/register')

const abs = require('../src')
const baseUrl = 'http://example.com/'
const cheerio = require('cheerio')
const cheerify = html => abs.cheerify(html).html()
const wrapBody = body => `<html><head></head><body>${body}</body></html>`

describe('module', () => {
  it('should export a function', function () {
    abs.should.be.a.Function()
  })
})

describe('resolving', () => {
  it('should ignore empty urls', () => {
    const input = '<img src="" />'
    const expected = cheerify(input)
    const html = abs(input, baseUrl)
    html.should.eql(expected)
  })
  
  it('should ignore whitespace', () => {
    const input = '<img src=" " />'
    const expected = cheerify(input)
    const html = abs(input, baseUrl)
    html.should.eql(expected)
  })
  
  it('should resolve ./ paths', () => {
    const input = '<img src="./assets/icon.png" />'
    const expected = cheerify(`<img src="${baseUrl}assets/icon.png" />`)
    const html = abs(input, baseUrl)
    html.should.eql(expected)
  })
  
  it('should resolve `file` paths', () => {
    const input = '<img src="icon.png" />'
    const expected = cheerify(`<img src="${baseUrl}icon.png" />`)
    const html = abs(input, baseUrl)
    html.should.eql(expected)
  })
  
  it('should resolve / root paths', () => {
    const input = '<img src="/hello/icon.png" />'
    const expected = cheerify(`<img src="${baseUrl}hello/icon.png" />`)
    const html = abs(input, baseUrl)
    html.should.eql(expected)
  })
  
  it('should ignore absolute paths', () => {
    const input = `
      <img src="${baseUrl}assets/icon.png" />
      <img src="https://external.com/img/logo.gif">
      <a href="http://www.google.com">search</a>
    `
    const expected = cheerify(input)
    const html = abs(input, baseUrl)
    html.should.eql(expected)
  })
  
  it('should resolve // urls to same domain with http as base', () => {
    const input = '<img src="//example.com/assets/icon.png" />'
    const expected = cheerify('<img src="http://example.com/assets/icon.png" />')
    const html = abs(input, 'http://example.com')
    html.should.eql(expected)
  })
  
  it('should resolve // urls to another domain with http as base', () => {
    const input = '<img src="//external.com/assets/icon.png" />'
    const expected = cheerify('<img src="http://external.com/assets/icon.png" />')
    const html = abs(input, 'http://example.com')
    html.should.eql(expected)
  })
  
  it('should resolve // urls to same domain with https as base', () => {
    const input = '<img src="//example.com/assets/icon.png" />'
    const expected = cheerify('<img src="https://example.com/assets/icon.png" />')
    const html = abs(input, 'https://example.com')
    html.should.eql(expected)
  })
  
  it('should resolve // urls to another domain with https as base', () => {
    const input = '<img src="//external.com/assets/icon.png" />'
    const expected = cheerify('<img src="https://external.com/assets/icon.png" />')
    const html = abs(input, 'https://example.com')
    html.should.eql(expected)
  })
})

describe('sources', () => {
  it('should resolve elements with src attribute', () => {
    const input = '<link src="css/style.css" />'
    const expected = cheerify(`<link src="${baseUrl}css/style.css" />`)
    const html = abs(input, baseUrl)
    html.should.eql(expected)
  })
  
  it('should resolve img element with responsive relative image uris', () => {
    const input = `
      <img alt="The Breakfast Combo"
       src="banner.jpg"
       srcset="banner-HD.jpg 2x, banner-phone.jpg 100w, banner-phone-HD.jpg 100w 2x">
    `
    const expected = cheerify(`
      <img alt="The Breakfast Combo"
       src="${baseUrl}banner.jpg"
       srcset="${baseUrl}banner-HD.jpg 2x, ${baseUrl}banner-phone.jpg 100w, ${baseUrl}banner-phone-HD.jpg 100w 2x">
    `)
    
    const html = abs(input, baseUrl)
    html.should.eql(expected)
  })
  
  it('should resolve source element with responsive relative image uris', () => {
    const input = `
      <source srcset="/img/test.jpg 1x, /img/test_retina.jpg 2x">
    `
    const expected = cheerify(`
      <source srcset="${baseUrl}img/test.jpg 1x, ${baseUrl}img/test_retina.jpg 2x">
    `)
    
    const html = abs(input, baseUrl)
    html.should.eql(expected)
  })
  
  it('should resolve relative video poster image urls', () => {
    const input = `<video controls poster="./img/test.gif">`
    const expected = cheerify(`<video controls poster="${baseUrl}img/test.gif">`)
    const html = abs(input, baseUrl)
    html.should.eql(expected)
  })
})

describe('hrefs', () => {
  it('should resolve elements with href attribute', () => {
    const input = '<element href="another/path.html" />'
    const expected = cheerify(`<element href="${baseUrl}another/path.html" />`)
    const html = abs(input, baseUrl)
    html.should.eql(expected)
  })
})

describe('styles', () => {
  it('should resolve urls inside inline css (style attribute)', () => {
    const input = `<div style="background-image: url('assets/icon.png');"></div>`
    const expected = cheerify(`<div style="background-image: url('${baseUrl}assets/icon.png');"></div>`)
    const html = abs(input, baseUrl)
    html.should.eql(expected)
  })
  
  it('should decode and reencode args such that urls inside inline css with encoded entities are resolved', () => {
    const input = `<div style="background-image: url(&quot;assets/icon.png&quot;);"></div>`
    const expected = `<html><head></head><body><div style="background-image: url(&quot;${baseUrl}assets/icon.png&quot;);"></div></body></html>`
    const html = abs(input, baseUrl)
    html.should.eql(expected)
  })
  
  it('should work with encoded absolute inline css sources', () => {
    const input = `\
<a data-label="game:198979" href="https://madisonvideogame.itch.io/madison-demo" \
class="game_thumb" data-action="game_grid" \
data-background_image="https://img.itch.zone/aW1hZ2UvMTk4OTc5LzkzMDY5MS5qcGc=/300x240%23c/rU2dY9.jpg" \
style="background-image:url(&quot;https://img.itch.zone/aW1hZ2UvMTk4OTc5LzkzMDY5MS5qcGc=/300x240%23c/rU2dY9.jpg&quot;);"></a>`
    const html = abs(input, baseUrl)
    html.should.eql(wrapBody(input))
  })
  
  it('should resolve urls inside style tags', () => {
    const input = `
      <style>
        body {
          background: url(logo.png)
        }
      </style>
    `
    const expected = cheerify(input.replace('logo.png', `${baseUrl}logo.png`))
    const html = abs(input, baseUrl)
    html.should.eql(expected)
  })
  
  it('should ignore css urls that identify a html element, e.g. for svgs', () => {
    const input = `
      <style>
        body {
          background: url(#element)
        }
      </style>
    `
    const expected = cheerify(input)
    const html = abs(input, baseUrl)
    html.should.eql(expected)
  })
})