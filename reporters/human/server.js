var reporter = require('./common.js')
var pkg = require('../../package.json')

var reporters = {

  listen: function listen (c, app) {
    var url
    if (app.listenOptions.server) {
      url = 'Custom HTTP server'
    } else {
      var protocol = app.listenOptions.cert ? 'wss://' : 'ws://'
      var host = app.listenOptions.host
      var port = app.listenOptions.port
      url = `${ protocol }${ host }:${ port }`
    }

    var result = [
      reporter.info(c, 'Logux server is listening'),
      reporter.params(c, [
        ['Logux server', pkg.version],
        ['PID', app.options.pid],
        ['Node ID', app.options.nodeId],
        ['Environment', app.env],
        ['Subprotocol', app.options.subprotocol],
        ['Supports', app.options.supports],
        ['Listen', url]
      ])
    ]

    if (app.env === 'development') {
      result = result.concat([
        reporter.note(c, 'Server was started in non-secure development mode'),
        reporter.note(c, 'Press Ctrl-C to shutdown server')
      ])
    }

    return result
  },

  connect: function connect (c, app, client) {
    return [
      reporter.info(c, 'Client was connected'),
      reporter.params(c, [
        ['Client ID', client.key],
        ['IP address', client.remoteAddress]
      ])
    ]
  },

  unauthenticated: function unauthenticated (c, app, client) {
    return [
      reporter.warn(c, 'Bad authentication'),
      reporter.params(c, [
        ['Node ID', client.nodeId],
        ['Subprotocol', client.sync.remoteSubprotocol],
        ['Client ID', client.key]
      ])
    ]
  },

  authenticated: function authenticated (c, app, client) {
    return [
      reporter.info(c, 'User was authenticated'),
      reporter.params(c, [
        ['Node ID', client.nodeId],
        ['Subprotocol', client.sync.remoteSubprotocol],
        ['Client ID', client.key]
      ])
    ]
  },

  disconnect: function disconnect (c, app, client) {
    var params
    if (client.nodeId) {
      params = reporter.params(c, [
        ['Node ID', client.nodeId]
      ])
    } else {
      params = reporter.params(c, [
        ['Client ID', client.key]
      ])
    }
    return [
      reporter.info(c, 'Client was disconnected'),
      params
    ]
  },

  destroy: function destroy (c) {
    return [
      reporter.info(c, 'Shutting down Logux server')
    ]
  },

  runtimeError: function runtimeError (c, app, client, err) {
    var prefix = `${ err.name }: ${ err.message }`
    if (err.name === 'Error') prefix = err.message
    return [
      reporter.error(c, prefix),
      reporter.prettyStackTrace(c, err, app.options.root),
      reporter.errorParams(c, client)
    ]
  },

  syncError: function syncError (c, app, client, err) {
    var prefix
    if (err.received) {
      prefix = `SyncError from client: ${ err.description }`
    } else {
      prefix = `SyncError: ${ err.description }`
    }
    return [
      reporter.error(c, prefix),
      reporter.errorParams(c, client)
    ]
  },

  clientError: function clientError (c, app, client, err) {
    return [
      reporter.warn(c, `Client error: ${ err.description }`),
      reporter.errorParams(c, client)
    ]
  }

}

module.exports = function serverReporter (type, app) {
  var c = reporter.color(app)
  var args = [c].concat(Array.prototype.slice.call(arguments, 1))
  return reporter.message(reporters[type].apply({ }, args))
}
