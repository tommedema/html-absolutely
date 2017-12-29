/* eslint-disable no-unused-vars */
require('should')
require('loud-rejection/register')

const abs = require('../src')
const baseUrl = 'http://example.com/'
const cheerio = require('cheerio')
const cheerify = html => cheerio.load(html).html({ decodeEntities: false })

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