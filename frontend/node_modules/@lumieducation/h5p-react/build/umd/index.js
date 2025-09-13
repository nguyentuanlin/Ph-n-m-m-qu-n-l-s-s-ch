(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./H5PPlayerUI", "./H5PEditorUI"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.H5PEditorUI = exports.H5PPlayerUI = void 0;
    const H5PPlayerUI_1 = require("./H5PPlayerUI");
    exports.H5PPlayerUI = H5PPlayerUI_1.default;
    const H5PEditorUI_1 = require("./H5PEditorUI");
    exports.H5PEditorUI = H5PEditorUI_1.default;
});
//# sourceMappingURL=index.js.map