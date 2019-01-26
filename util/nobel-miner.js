'use strict';
const fs = require('fs');
const parse = require('csv-parse');
const sprintf = require('sprintf-js').sprintf;
const parseFullName = require('parse-full-name').parseFullName;
const unfluff = require('unfluff');
const request = require('request');

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
function composeNobelFactsUrl (field, year, lastName) {
  let urlLastName = lastName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return sprintf('https://www.nobelprize.org/prizes/%s/%d/%s/facts/',
    field, year, urlLastName);
}

function fetchNobelData (field, year, lastName, cb) {
  request(composeNobelFactsUrl(field, year, lastName),
    { json: true }, (err, res, body) => {
    if (err) { return console.log(err); }
    let text = unfluff(body).text;
    let parts = text.split('Back to top');
    console.log(parts);
    text = parts[0];
    console.log(text);
    text = text.replace(/\n+/, '\n');
    let lines = text.split('\n').filter(function (el) {
      return el.length > 0;
    });
    console.log(lines);
    let obj = {};
    for (let ii in lines) {
      let line = lines[ii];
      if (-1 === line.indexOf(':')) {
        console.log(line);
        obj['blurb'] = line;
      } else {
        let fields = line.split(':');
        let field = fields[0].trim();
        let info = fields[1].trim();
        obj[field] = info;
        console.log(sprintf('[%s]:[%s]', field, info));
      }
    }
    cb(null, obj);
  });
}

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

    let urls = [];
    let counter = 0;
    for (let jj in physics) {
      let name = parseFullName(physics[jj]);
      fetchNobelData('physics', year, name.last, function (err, blurb) {
        console.log(blurb);
        if (++counter == 5) {
          process.exit(0);
        }
      });
    }

    console.log(year);
    console.log(physics);
    console.log(urls);
  })
}

