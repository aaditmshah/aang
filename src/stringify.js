"use strict";

module.exports = value => {
    try {
        return JSON.stringify(value) || typeof value;
    } catch {
        return "circular object";
    }
};
