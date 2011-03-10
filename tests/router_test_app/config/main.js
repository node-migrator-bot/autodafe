module.exports = {
  name      : 'app_with_bad_controllers',
  base_dir  : __dirname + '/../',
  preload_components   : [ 'log_router' ],
  components: {
    log_router : {
      routes : {
        console : {
          levels : [ 'trace', 'error', 'warning', 'info' ]
        }
      }
    }
  }
}