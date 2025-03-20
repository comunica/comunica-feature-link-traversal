#/bin/bash

query='SELECT (COUNT(*) AS ?count) WHERE { ?message <http://localhost:3100/ldbc_socialnet/1.0/vocabulary/hasCreator> <http://localhost:3000/pods/00000000000000000933/profile/card#me>. }'
query='PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX snvoc: <http://localhost:3100/ldbc_socialnet/1.0/vocabulary/>
SELECT ?messageId ?messageCreationDate ?messageContent WHERE {
  ?message snvoc:hasCreator <http://localhost:3000/pods/00000000000000000933/profile/card#me>;
    rdf:type snvoc:Post;
    snvoc:content ?messageContent;
    snvoc:creationDate ?messageCreationDate;
    snvoc:id ?messageId.
}'
#query='SELECT ?message WHERE { ?message <http://localhost:3100/ldbc_socialnet/1.0/vocabulary/hasCreator> <http://localhost:3000/pods/00000000000000000933/profile/card#me>. }'

curl --data "$query" --header "content-type: application/sparql-query" http://localhost:4000/sparql?default-graph-uri=http://localhost:3000/pods/00000000000000000933/
