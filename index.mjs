
import { QueryEngineFactory } from "@comunica/query-sparql-link-traversal";
import { LoggerPretty } from "@comunica/logger-pretty";

const query = `
PREFIX sosa: <http://www.w3.org/ns/sosa/> 
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#> 

SELECT ?s ?t WHERE {
    ?s sosa:resultTime ?t.
FILTER(?t<"2020-12-08T22:55:51.000Z"^^xsd:dateTime && ?t>="2020-12-07T04:44:35.000"^^xsd:dateTime)
}`;

const datasource = "https://tree.linkeddatafragments.org/sytadel/ldes/ais";//"http://localhost:3000/ldes/test";
const config = "/home/id357/Documents/PhD/coding/comunica-feature-link-traversal/engines/config-query-sparql-link-traversal/config/config-tree.json";


const engine = await new QueryEngineFactory().create({ configPath: config });
const bindingsStream = await engine.queryBindings(query,
  {
    sources: [datasource],
    lenient: true,
    log: new LoggerPretty({ level: 'trace' })
  });
bindingsStream.on('data', (binding) => {
  console.log(binding.toString());
});

bindingsStream.on('error', (error) => {
  console.log(error)
});

