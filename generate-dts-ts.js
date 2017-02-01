var fs = require('fs');
fs.writeFileSync('./src/dts.ts', ['export class JayData{',
    '    static src:string = ' + JSON.stringify(fs.readFileSync('./jaydata.d.ts', 'utf8').replace(new RegExp("\r\n", 'g'), "\n")),
    '}'].join('\n'), 'utf8');