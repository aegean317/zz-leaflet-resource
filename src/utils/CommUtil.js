export function getGuid() {
    const S4 = function () {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    return (S4() + S4() + S4() + S4() + S4() + S4() + S4() + S4())
}
export function isEmpty(value) {
    var type
    if (value == null) {
        // 等同于 value === undefined || value === null
        return true
    }
    type = Object.prototype.toString.call(value).slice(8, -1)
    switch (type) {
        case 'String':
            return value.trim() === ''
        case 'Array':
            return !value.length
        case 'Object':
            return !Object.keys(value).length
        case 'Boolean':
            return !value
        default:
            return false // 其他对象均视作非空
    }
}