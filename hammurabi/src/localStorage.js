export function remember(obj, val) {
    if (typeof obj === "object") {
        for (let prop in obj) {
            localStorage.setItem(prop, obj[prop])
        }
    } else {
        localStorage.setItem(obj, val)
    }
}
export function recall(state) {
    if (typeof state === "string") {
        return localStorage.getItem(state)
    } else {
        let obj = {}
        for (let prop in state) obj[prop] = localStorage.getItem(prop)
        return obj
    }
}
