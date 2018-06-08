#!/usr/bin/env node

'use strict';

const program = require('commander');

program
  .version('0.0.1', '-v, --version')
  .usage('[options] <file.org>')
  .option('-c, --client <jsonfile>', 'client.json')
  .option('-r, --rate <n>', 'Hourly Rate', parseFloat)
  .option('-n, --name <name>', 'Client Name')
  .option('-a, --address <address>', 'Client Address');

program
  .action(function(env){
    let client = {
      name: program.name,
      rate: program.rate,
      address: program.address,
      worklog: env,
    };

    //var client = require(__dirname + program.client);
    //var config = require(__dirname + env);
    console.log(client);
  });

program.parse(process.argv);

function invoice(client){
  console.log('Invoicing %s', name)
  console.log('invoicing ', args)
}
