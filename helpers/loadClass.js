/**
 * @description load a JS class from the scripts folder and add it to main memory
 * @author David Coen
 * 
 * @param {String} className Full class name, with uppercase first letter, e.g. 'Lyric'
 * @returns {object} The class that can be instantiated
 * @usage e.g. Lyric = loadClass('Lyric');
 */
module.exports = function loadClass(className) {
    var fs = require('fs');
    const fileName = className.charAt(0).toLowerCase() + className.slice(1);
    var classFile = fs.readFileSync(`./script/${fileName}.js`, 'utf8');
    classFile += `module.exports = ${className};`;
    const mjsFile = __dirname + '/_' + fileName + '.cjs';
    fs.writeFileSync(mjsFile, classFile);
    const obj = require(mjsFile);
    fs.unlinkSync(mjsFile);
    return obj;
};