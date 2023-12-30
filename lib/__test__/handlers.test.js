const handlers = require('../handlers')

test('home page renders', () => {
    // 创建一个空的请求对象
    const req = {}
    // 创建一个带有 render 方法的模拟响应对象 res
    // 使用 jest.fn() 创建一个模拟函数，用于跟踪 render 方法的调用。
    const res = { render: jest.fn() }
    // 调用 handlers.home 函数
    handlers.home(req, res)
    // res.render.mock.calls：这是一个数组，包含了 render 方法每次被调用时的参数列表。每个元素都是一个数组，代表一次调用的参数列表。
    // 断言：检查 render 方法是否被调用了一次
    expect(res.render.mock.calls.length).toBe(1)
    // 断言：检查 render 方法被调用时的第一个参数是否为 'home'
    // [0]：这是获取数组的第一个元素，即第一次调用 render 方法的参数列表。
    // [0]：这是获取参数列表的第一个元素，即 render 方法被调用时的第一个参数。
    expect(res.render.mock.calls[0][0]).toBe('home')
})

test('about page renders with fortune', () => {
    const req = {}
    const res = { render: jest.fn() }
    handlers.about(req, res)

    expect(res.render.mock.calls.length).toBe(1)
    expect(res.render.mock.calls[0][0]).toBe('about')
    // toEqual 是 Jest 的匹配器，用于断言两个对象是否相等。
    // expect.objectContaining(...) 是一个匹配器，用于验证对象是否包含指定的属性。
    // expect.stringMatching(/\W/) 的含义是期望字符串匹配包含任何非单词字符的模式。
    expect(res.render.mock.calls[0][1]).toEqual(expect.objectContaining({
        fortune: expect.stringMatching(/\W/),
    }))
})

test('404 handler renders', () => {
    const req = {}
    const res = { render: jest.fn() }
    handlers.notFound(req, res)
    expect(res.render.mock.calls.length).toBe(1)
    expect(res.render.mock.calls[0][0]).toBe('404')
})

test('500 handler renders', () => {
    const err = new Error('some error')
    const req = {}
    const res = { render: jest.fn() }
    // 创建一个使用 Jest 模拟函数的变量 next。
    const next = jest.fn()

    handlers.serverError(err, req, res, next)
    expect(res.render.mock.calls.length).toBe(1)
    expect(res.render.mock.calls[0][0]).toBe('500')
})

