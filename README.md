# Org2Invoice
CLI tool for converting an org file with org-clock reports into a PDF invoice.

Collect LOGBOOK to END, sum minutes into total, collect lines into description.
{
  date: last date,
  total: total_time,
  description: [blah, blah],
}
Stop at "Invoiced""

## TODO
- parse org file
- print to stdout
- pdf creation
- support for profiles
- support for templates
- support for BTC

## References
- https://github.com/rgruesbeck/invoicer/blob/master/index.js
- https://github.com/tj/commander.js/tree/master/examples
- https://medium.freecodecamp.org/writing-command-line-applications-in-nodejs-2cf8327eee2
