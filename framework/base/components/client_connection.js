var Component = require('./component');
var Session   = require('session');

module.exports = ClientConnection.inherits( Component );

function ClientConnection( params ) {
  this._init( params );
}


ClientConnection.prototype._on_connect = function ( session_id ) {
  var session = new Session({
    id  : session_id,
    app : this.app
  });
  
  this.app.emit( 'new_session', session, this );
  this.app.router.route( this.app.default_controller + '.client_connect', session.id );
};