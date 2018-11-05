class OrderSummary {
    constructor(burgermeal, salad, location, customer) {
        this.burgermeal = burgermeal || undefined,
        this.salad = salad || undefined,
        this.location = location || undefined,
        this.customer = customer || undefined
    }
}
exports.OrderSummary = OrderSummary;