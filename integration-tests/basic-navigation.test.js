const portfinder = require('portfinder')
const puppeteer = require('puppeteer')
const app = require('../meadowlark.js')

let server = null
let port = null

// 测试套件（test suite）中的两个钩子函数：beforeEach 和 afterEach。
beforeEach(async () => {
    port = await portfinder.getPortPromise()
    server = app.listen(port)
})

afterEach(() => {
    server.close()
})

test('home page links to about page', async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(`http://localhost:${port}`)
    // Promise.all 返回一个 Promise，它会在所有的 Promise 都解决后才解决。
    await Promise.all([
        page.waitForNavigation(),
        page.click('[data-test-id="about"]'),
    ])
    expect(page.url()).toBe(`http://localhost:${port}/about`)
    await browser.close()
})
    
    
