var AppModule = global.autodafe.AppModule;
var Query     = require('./query');

module.exports = Client.inherits( AppModule );

function Client( params ) {
  this._init( params );
}


Client.prototype._init = function( params ) {
  Client.parent._init.call( this, params );

  var ClientConnection = require( './client_connection' );
  if ( !ClientConnection.is_instantiate( params.connection ) )
    throw new Error( '`connection` is not instance of ClientConnection in Client._init' );

  this._.connection  = params.connection;
  this._.session     = this.app.get_session( this.get_session_id(), this );
  this._.connected   = false;

  this._call_controller();
};


Client.prototype._call_controller = function () {
  var controller = this.app.router.get_controller( this.app.default_controller );
  var emitter;
  if (
    !controller ||
    !( ( emitter = controller.connect_client( this ) ) instanceof process.EventEmitter )
  )
    return this._after_connect();


  var self = this;
  emitter
    .on( 'success', function() {
      self._after_connect();
    } )
    .on( 'error', function( e ){
      self.send_error( e );
    } );
};


Client.prototype._after_connect = function () {
  this.log( '%s is connected ( session id=%s )'.format( this.class_name, this.get_session_id() ) );

  this._.connected = true;
  this.emit( 'connect' );
  this.connection.emit( 'connect_client', this );
};


Client.prototype._create_query = function ( params ) {
  params        = params || {};
  params.app    = this.app;
  params.client = this;

  return new Query( params );
};


Client.prototype.disconnect = function () {
  this.log( '%s is disconnected ( session id=%s )'.format( this.class_name, this.get_session_id() ) );

  this.emit( 'disconnect' );
  this.connection.emit( 'disconnect_client', this );
};


Client.prototype.receive = function ( query ) {
  this.log( 'Message has been received from %s. Session id - `%s`'.format( this.class_name, this.get_session_id() ) );

  this.emit( 'receive_request', query );
  this.connection.emit( 'receive_request', query );

  try {
    this.app.router.route( query );
  }
  catch ( e ) {
    this.send_error( e );
  }
};


Client.prototype.send = function ( data ) {
  this.log( 'Send message to %s ( session id=%s )'.format( this.class_name, this.get_session_id() ) );

  this.emit( 'send', data );
  this.connection.emit( 'send_response', data, this );
};


Client.prototype.send_error = function ( e ) {
  this.log( e && e.stack || e, 'warning' );

  this.emit( 'send_error', e );
  this.connection.emit( 'send_error', e, this );
};


Client.prototype.get_session_id = function () {
  return this.session ? this.session.id : String.unique();
};


Client.prototype.get_cookie = function () {};
Client.prototype.set_cookie = function () {};