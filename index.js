#!/usr/bin/env node

'use strict';

const fs = require('fs');
const es = require('event-stream');
const reduce = require('stream-reduce');
const program = require('commander');
const handlebars = require('handlebars');
const moment = require('moment');

require.extensions['.html'] = (module, filename) => {
  module.exports = fs.readFileSync(filename, 'utf8');
};

program
  .version('0.0.1', '-v, --version')
  .usage('[options] <file.org>')
  .option('-p, --profile <jsonfile>', 'client.json')
  .option('-t, --template <templatefile>', 'template.html')
  .option('-r, --rate <n>', 'Hourly Rate', parseFloat)
  .option('-c, --client <client_name>', 'Client Name')
  .option('-a, --address <client_address>', 'Client Address');

program
  .action(function(env){
    let client = {
      name: program.client || rand_str('client:'),
      template: program.template || __dirname + '/templates/plain.html',
      rate: (program.rate || 20) / 60,
      address: program.address || "remote",
      worklog: env,
    };

    invoice(client);
  });

program.parse(process.argv);

function invoice(client){
  fs.createReadStream(client.worklog)
    .pipe(es.split())
    .pipe(reduce(function(work, data) {
      return addWork(work, data);
    }, {
      id: rand_str(),
      date: new Date().toISOString(),
      log: new Map(),
      to: client,
      rate: client.rate,
      total: 0
    }))
    .on("data", function(work) {
      let source = require(__dirname + '/templates/plain.html');
      let template = handlebars.compile(source);
      let html = template({
        id: work.id,
        date: work.date,
        log: Array.from(work.log),
        total: work.total.toFixed(2),
      });
      console.log(html);
      //console.log(work);
    });
}

function addWork(work, data){
  return [ data ]
    .map((i) => {
      // Stringify
      return i.toString();
    })
    .filter((i) => {
      // LogBook Entries Only
      return /^CLOCK|^TASK/.test(i);
    })
    .map((i) => {
      // Clock Entries
      let time = i
          .match(/=>.*$/)[0]
          .replace('=>  ', '')
          .split(":")
          .reduce((total, n, idx) => {
            let t = parseInt(n);
            return total + (idx == 0 ? (t * 60) : t);
          }, 0);

      return {
        date: i.match(/\d...-\d.-\d./)[0],
        time: time ? time : 0,
        value: time ? time * work.rate : 0,
        description: '',
        data: i
      };
    })
    .map((i) => {
      // Task Entries
      i.description = /^TASK/.test(i.data) ?
        i.description + ', ' + i.data.match(/=>.*$/)[0].replace('=>  ', '') :
        '';
      return i;
    })
    .reduce((work, i) => {
      // Update Date
      if(work.log.has(i.date)) {
        // Old Date
        let wi = work.log.get(i.date);
        work.log.set(i.date, {
          time: wi.time += i.time,
          value: wi.value += i.value,
          description: wi.description += i.description
        });
      } else {
        // New Date
        work.log.set(i.date, {
          time: i.time,
          value: i.value,
          description: i.description
        });
      }

      // Update Value
      work.total += i.value;

      return work;
    }, work)
}

function render(work){
  return handlebars.compile(work.client.template)({
    to: work.to,
    from: work.from,
    date: moment().format('MMMM Do YYYY'),
    invoice_id: work.id,
    items: work.log,
    total: work.total
  });
}

function rand_str(str){
  let prefix = str || '';
  return [
    ...prefix,
    Math.random().toString(16).slice(2)
  ].join('');
}

/*
  //var client = require(__dirname + program.client);
  //var config = require(__dirname + env);
*/
