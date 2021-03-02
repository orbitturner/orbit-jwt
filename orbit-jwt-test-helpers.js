"use strict";

function encodeTestToken(payload) {
    //don't actually check or care about the header or signature in orbit-jwt
    return "." + btoa(JSON.stringify(payload)) + ".";
}
exports.encodeTestToken = encodeTestToken;
//# sourceMappingURL=orbit-jwt-test-helpers.js.map