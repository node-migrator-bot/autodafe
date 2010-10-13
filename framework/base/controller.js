var Controller = module.exports = function( params ) {
  this._init( params );
}


require( 'sys' ).inherits( Controller, process.EventEmitter );
Controller.prototype.actions = [ 'default_action' ];
Controller.prototype.default_action = 'default_action';


Controller.prototype._init = function ( params ) {
  this._actions = {};

  for ( var a = 0, a_ln = this.actions.length; a < a_ln; a++ ) {
    this._actions[ this.actions[a] ] = 1;
  }
};


Controller.prototype.run_action = function ( action, args ) {
  action = action || this.default_action;

  if ( !this._actions[ action ] || !this[ action ] )
    return console.log( 'Unspecified action "' + action + '" in Controller "' + this.name + '"' );

  this[ action ].apply( this, args || [] );
};