var AppModule = require('app_module');

module.exports = JoinQuery.inherits( AppModule );

function JoinQuery( params ) {
  this._init( params );
}


JoinQuery.prototype._init = function( params ) {
  this.super_._init( params );

  var JoinElement = require( './join_element' );
  if ( !JoinElement.is_instantiate( params.join_element ) ) throw new Error(
    '`join_element` should be instance of JoinElement in JoinQuery.init'
  );
  this._.join_element = params.join_element;

  var DbTableSchema = require('../db_table_schema');
  if ( !DbTableSchema.is_instantiate( params.table ) ) throw new Error(
    '`table` should be instance of DbTableSchema in JoinQuery.init'
  );
  this._.table = params.table;

  this.selects    = [];
  this.distinct   = false;
  this.joins      = [];
  this.conditions = [];
  this.orders     = [];
  this.groups     = [];
  this.havings    = [];
  this.limit      = -1;
  this.offset     = -1;
  this.params     = {};
  this.elements   = [];
  
  if( params.criteria ) {
    this.selects    .push( this.join_element.get_column_select( this.table, params.criteria.select ) );
    this.joins      .push( this.join_element.get_table_name_with_alias( this.table ) );
    this.joins      .push( params.criteria.join       );
    this.conditions .push( params.criteria.condition  );
    this.orders     .push( params.criteria.order      );
    this.groups     .push( params.criteria.group      );
    this.havings    .push( params.criteria.having     );

    this.limit  = params.criteria.limit;
    this.offset = params.criteria.offset;
    this.params = params.criteria.params;

    if ( !this.distinct && params.criteria.distinct )
      this.distinct = true;
  }

  else {
    this.selects.push   ( this.join_element.get_primary_key_select( this.table )    );
    this.joins.push     ( this.join_element.get_table_name_with_alias( this.table ) );
    this.conditions.push( this.join_element.get_primary_key_range( this.table )     );
  }

  this.elements[ this.join_element.id ] = true;
};


JoinQuery.prototype.join = function( element ) {
  this.selects    .push( element.get_column_select( element.relation.select ) );
  this.conditions .push( element.relation.condition   );
  this.orders     .push( element.relation.order       );
  this.joins      .push( element.get_join_condition() );
  this.joins      .push( element.relation.join        );
  this.groups     .push( element.relation.group       );
  this.havings    .push( element.relation.having      );

  if(is_array(element.relation.params))
  {
    if(is_array(this.params))
      this.params=array_merge(this.params,element.relation.params);
    else
      this.params=element.relation.params;
  }
  this.elements[element.id]=true;
}

JoinQuery.prototype.create_command = function( builder ){
  var sql = ( this.distinct ? 'SELECT DISTINCT ' : 'SELECT ' ) + this.selects.join(', ') +
            ' FROM ' + this.joins.join(' ');

  var conditions = this.conditions.filter( function( condition ) {
    return !!condition;
  } );

  if ( conditions.length ) sql += ' WHERE (' + conditions.join( ') AND (' ) + ')';

  var groups = this.groups.filter( function( group ){
    return !!group;
  } );

  if ( groups.length ) sql += ' GROUP BY ' + groups.join(', ');

  var havings = this.havings.filter( function( having ){
    return !!having;
  } );

  if( havings.length ) sql += ' HAVING (' + havings.join( ') AND (' ) + ')';

  var orders = this.orders.filter( function( order ){
    return !!order;
  } );

  if ( orders.length ) sql += ' ORDER BY ' + orders.join(', ');

  sql = builder.apply_limit( sql, this.limit, this.offset );
  return builder.db_connection.create_command( sql ).bind_values( this.params );
}