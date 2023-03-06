const communica = require("@comunica/query-sparql-link-traversal");
const log = require("@comunica/logger-pretty");

const myConfigPath = './config.json'

new communica.QueryEngineFactory().create({ configPath: myConfigPath,  }).then(
  (engine) => {
    engine.queryBindings(`
  SELECT ?s WHERE {
    ?s <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <https://w3id.org/tree#node>.
  }`, {
      sources: ['https://treecg.github.io/demo_data/vtmk/f.ttl'],
      lenient: true,
      log: new log.LoggerPretty({ level: 'trace' }),
    }).then((bindingsStream) => {
      bindingsStream.on('data', (binding) => {
        console.log(binding.toString());
      });

    });
  }
);