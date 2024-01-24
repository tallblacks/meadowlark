module.exports = (req,res,next) => {
	const { cart } = req.session
	if(!cart) return next()
    // 如果 cart.items 数组中至少有一个元素 item 满足条件 item.product.requiresWaiver，则执行代码块。
	if(cart.items.some(item => item.product.requiresWaiver)) {
        cart.warnings.push('One or more of your selected ' +
            'tours requires a waiver.')
	}
	next()
}