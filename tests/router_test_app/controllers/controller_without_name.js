var Controller  = require( 'controller' );

module.exports = WithoutNameController.inherits( Controller );

function WithoutNameController( params ) {
  this._init( params );
}


WithoutNameController.prototype.actions  = [
  'test'
];


WithoutNameController.prototype.test = function() {

};