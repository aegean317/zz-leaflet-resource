/**
     * 分组函数，暂时无法进行多层分组。如有需要可以使用groupBy+map+flat方法打平
     * @param {*} f 
     */
Array.prototype.groupBy = function (f) {
    var groups = {}
    this.forEach(function (o) {
        var group = JSON.stringify(f(o))
        groups[group] = groups[group] || []
        groups[group].push(o)
    })
    return Object.keys(groups).map(group => groups[group])
}
/**
 * 用于数组对象去重
 * 单纯数组可用[...new Set(arr)]
 * @param {*} f 
 */
Array.prototype.distinct = function (f) {
    const arr = [], obj = {}
    this.forEach(item => {
        const val = f(item)
        !obj[val] && (obj[val] = arr.push(item))
    })
    return arr
}
Array.prototype.max = function () {
    return Math.max.apply({}, this)
}
Array.prototype.min = function () {
    return Math.min.apply({}, this)
}
Array.prototype.sum = function () {
    return this.length > 0 ? this.reduce((prev = 0, curr = 0) => prev + curr) : 0
}
Array.prototype.desc = function (f) {
    return this.sort((n1, n2) => (f ? f(n2) : n2) - (f ? f(n1) : n1))
}
Array.prototype.asc = function (f) {
    return this.sort((n1, n2) => (f ? f(n1) : n1) - (f ? f(n2) : n2))
}
Array.prototype.clear = function () {
    this.length = 0
    return this
}