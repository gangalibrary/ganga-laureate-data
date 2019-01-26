'use strict';
const fs = require('fs');
const parse = require('csv-parse');
const sprintf = require('sprintf-js').sprintf;
const parseFullName = require('parse-full-name').parseFullName;

let csvFile = fs.readFileSync('../data/nobel.csv', 'utf-8');
let csvLines = csvFile.split('\n');
for (let ii in csvLines) {
  let line = csvLines[ii];
  parse(line, function (err, output) {
    let fields = output[0];

    if (undefined === fields) {
      return;
    }

    let year = parseInt(fields[0]);
    let physics = fields[1].replace(/ +(?= )/g, ';').replace(/;+/, ';').split(';');
    for (let jj in physics) {
      physics[jj] = physics[jj].trim();
    }
    var filtered = physics.filter(function (el) {
      return (el.length > 0);
    });
    physics = filtered;

    /*
     * Generate a link to the actual Nobel Prize site for this laureate. The
     * Nobel site (generally) uses the format:
     *
     *  https://www.nobelprize.org/prizes/YEAR/FIELD/LASTNAME/facts/
     *
     * Where
     *  - YEAR is YYYY
     *  - FIELD is lowercase in (physics, chemistry, medicine, literature,
     *    peace, economic-sciences)
     *  - LASTNAME is lowercase with accents/diacritics removed
     */
    let urls = [];
    for (let jj in physics) {
      let name = parseFullName(physics[jj]);
      let lastName = name.last.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      let url = sprintf('https://www.nobelprize.org/prizes/physics/%d/%s/facts/',
        year, lastName);
      urls.push(url);
    }

    console.log(year);
    console.log(physics);
    console.log(urls);
  })
}

