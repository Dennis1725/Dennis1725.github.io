export function hasMethods(obj, methodNames) {
    if (!obj || !Array.isArray(methodNames)) {
        return false;
    }
    return methodNames.every(name => typeof obj[name] === 'function');
}
