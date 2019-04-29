"use strict";

module.exports = value => {
    try {
        return JSON.stringify(value) || "function";
    } catch {
        return "circular object";
    }
};
