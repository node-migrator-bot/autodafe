var Client = require('../client');
var cookie = require('../../lib/cookie');

module.exports = WebSocketsClient.inherits( Client );

function WebSocketsClient( params ) {
  this._init( params );
}


WebSocketsClient.prototype._init = function( params ) {
  if ( !params || !params.ws_client )
    throw new Error( '`ws_client` should be Socket.IO client in WebSocketsClient.init' );

  this.ws_client = params.ws_client;
  var self = this;

  this.ws_client.on( 'message', function( message ) {
    self.receive( message );
  } );

  this.ws_client.on( 'disconnect', function() {
    self.disconnect();
  } );

  WebSocketsClient.parent._init.call( this, params );
};


WebSocketsClient.prototype._after_connect = function () {
  this.receive = this.__receive;
  WebSocketsClient.parent._after_connect.call( this );
};


WebSocketsClient.prototype.receive = function ( message ) {
  var self = this;
  this.once( 'connect', function() {
    self.__receive( message );
  } );
};


WebSocketsClient.prototype.__receive = function ( data ) {
  if ( typeof data != 'object' )
    return this.log( 'Message "%s" should be javascript Object'.format( data ), 'warning' );

  var query = this.create_query({
    action          : data.action,
    params          : data.params,
    connection_type : 'ws'
  });

  WebSocketsClient.parent.receive.call( this, query );
};


WebSocketsClient.prototype.get_session_id = function () {
  var sid = this.get_cookie( 'autodafe_sid' );

  return sid ? sid : this.ws_client.id;
};


WebSocketsClient.prototype.get_cookie = function ( cookie_name ) {
  return cookie.read( this.ws_client.handshake.headers.cookie, cookie_name );
};


WebSocketsClient.prototype.send = function ( data, action  ) {
  WebSocketsClient.parent.send.call( this, data );

  this.ws_client.emit( action, data );
};


WebSocketsClient.prototype.broadcast = function ( action, data ) {
  this.log( 'Broadcast message `%s` from %s ( session id=%s )'.format( action, this.class_name, this.get_session_id() ) );

  this.emit( 'broadcast', data );
  this.connection.emit( 'broadcast', data, this );

  this.ws_client.broadcast.emit( action, data );
};


WebSocketsClient.prototype.get_client_by_id = function ( id ) {
  return this.connection.io.sockets.socket[ id ];
};

