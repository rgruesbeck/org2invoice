#!/usr/bin/env node

'use strict';

const fs = require('fs');
const es = require('event-stream');
const reduce = require('stream-reduce');
const program = require('commander');

program
  .version('0.0.1', '-v, --version')
  .usage('[options] <file.org>')
  .option('-p, --profile <jsonfile>', 'client.json')
  .option('-r, --rate <n>', 'Hourly Rate', parseFloat)
  .option('-c, --client <client_name>', 'Client Name')
  .option('-a, --address <client_address>', 'Client Address');

program
  .action(function(env){
    let client = {
      client: program.client || rand_str('client'),
      rate: (program.rate || 20) / 60,
      address: program.address || "remote",
      worklog: env,
    };

    invoice(client);
  });

program.parse(process.argv);


const buildInvoice = es.writeArray((err, array) => {
  return array;
})

function invoice(client){
  fs.createReadStream(client.worklog)
    .pipe(es.split())
    .pipe(reduce(function(work, data) {
      return addWork(work, data);
    }, new Map().set('client', client).set('total', 0)))
    .on("data", function(work) {
      console.log(work);
    });
}

function addWork(work, data){
  let client = work.get('client');
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
        value: time ? time * client.rate : 0,
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
    .reduce((wk, i) => {
      // Update Date
      if(wk.has(i.date)) {
        // Old Date
        let wi = wk.get(i.date);
        wk.set(i.date, {
          time: wi.time += i.time,
          value: wi.value += i.value,
          description: wi.description += i.description
        });
      } else {
        // New Date
        wk.set(i.date, {
          time: i.time,
          value: i.value,
          description: i.description
        });
      }

      // Update Value
      let total = wk.get('total') + i.value;
      wk.set('total', total);

      return wk;
    }, work)
}

function rand_str(prefix){
  return [
    ...prefix,
    '_',
    Math.random().toString(16).slice(2)
  ].join('');
}

/*
  //var client = require(__dirname + program.client);
  //var config = require(__dirname + env);
*/
