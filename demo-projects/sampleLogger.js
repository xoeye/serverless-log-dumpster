module.exports.handler = (event, ctx, callback) => {
  console.log('Received request!', Date.now(), event)
  callback(null, 'OK')
}
