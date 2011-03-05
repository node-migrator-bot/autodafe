exports.add_tests_to = function( suite ) {
  var assert            = require('assert');
  var Router            = require('router');
  var Logger            = require('logging/logger');
  var ComponentsManager = require('components/components_manager');
  var Autodafe          = require( 'autodafe' );
  var LogRouter         = require( 'logging/log_router' );
  var AError            = require( 'aerror' );
  var TestComponent     = require( 'tests/test_component' );
  var path              = require( 'path' );
  var config            = require('config/main');

  suite.addBatch({
    'application tests' : {
      topic : suite.application,
      'public properties' : {
        'name test' : function ( app ) {
          assert.equal( app.name, config.name );
        },
        'logger instance test' : function( app ) {
          assert.instanceOf( app.logger, Logger );
        },
        'router instance test' : function( app ) {
          assert.instanceOf( app.router, Router );
        },
        'components instance test' : function( app ) {
          assert.instanceOf( app.components, ComponentsManager );
        },
        'default controller' : function( app ){
          assert.equal( app.default_controller, config.default_controller );
        },
        'required properties must be getters' : function( app ) {
          assert.throws( function() {
            app.base_dir = '';
          }, TypeError, 'base_dir' );
          assert.throws( function() {
            app.name = '';
          }, TypeError, 'name' );
        },
        'application with minimalistic configurations' : {
          topic : function() {
            var min_config  = require('config/min_config');
            var min_app     = Autodafe.create_application( min_config );
            min_app.run();
            return min_app;
          },
          'default controller' : function( app ){
            assert.equal( app.default_controller, 'action' );
          }
        }
      },

      '_preload_components' : function() {
        var preloaded_logger_config   = require( 'config/preloaded_logger_config' );

        var application_created       = false;
        var log_router_in_controller  = null;
        var tests_in_controller       = null;

        process.once( 'Preloaded logger component', function( log_router ) {
          log_router_in_controller = log_router;
          application_created = true;
        } );

        // tests must be not loaded yet
        process.once( 'Not preloaded tests component', function( tests ) {
          tests_in_controller = tests;
        } );

        var app = Autodafe.create_application( preloaded_logger_config );
        assert.isTrue( application_created, 'Application with preloaded logger is not created' );

        assert.instanceOf( log_router_in_controller, LogRouter, 'log router must be preloaded' );
        assert.isUndefined( tests_in_controller, 'tests component must not be preloaded' );

        assert.instanceOf( app.tests, TestComponent, 'Test component must be available after loading' );
      },

      '_check_config' : {
        topic : require( 'config/wrong_config' ),
        'base_dir is required' : function( config ) {
          assert.throws( function() {
            Autodafe.create_application( config );
          }, AError );
        },
        'name is required' : function( config ) {
          config.base_dir = path.resolve('.');
          assert.throws( function() {
            Autodafe.create_application( config );
          }, AError );
        },
        'only name and base_dir are required' : function( config ) {
          config.name = 'working_app';
          assert.doesNotThrow( function() {
            Autodafe.create_application( config );
          } );
        }
      },

      'tests params' : {
        'param is string' : function( app ) {
          assert.equal( app.get_param( 'param1' ), 'some param' );
        },
        'param is zero' : function( app ){
          assert.isZero( app.get_param( 'param2' ) );
        },
        'param is false' : function( app ){
          assert.isFalse( app.get_param( 'param3' ) );
        },
        'param is null' : function( app ){
          assert.isNull( app.get_param( 'param4' ) );
        },
        'unexisted param' : function( app ){
          assert.isNull( app.get_param( 'param5' ) );
        }
      },

      'application must not be runned twice' : function( app ) {
        var double_runned = false;

        app.once( 'run', function() {
          double_runned = true;
        } )

        assert.isFalse( app.run() );
        assert.isFalse( double_runned );
      },

      'log is function' : function( app ) {
        assert.isFunction( app.log );
      }
    }
  });
}